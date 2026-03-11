import pytest
import asyncio
from pdf_service.domain.services import JobManager, JobStatus

@pytest.mark.asyncio
async def test_job_submission():
    jm = JobManager()
    
    async def sample_job():
        await asyncio.sleep(0.1)
        return "success"
    
    job_id = jm.submit("test_job", sample_job())
    assert job_id is not None
    
    info = jm.get_info(job_id)
    assert info.kind == "test_job"
    
    result = await jm.await_job(job_id)
    assert result == "success"
    assert info.status == JobStatus.SUCCEEDED

@pytest.mark.asyncio
async def test_job_failure():
    jm = JobManager()
    
    async def failing_job():
        await asyncio.sleep(0.1)
        raise ValueError("Job failed")
    
    job_id = jm.submit("failing_job", failing_job())
    
    with pytest.raises(ValueError, match="Job failed"):
        await jm.await_job(job_id)
    
    info = jm.get_info(job_id)
    assert info.status == JobStatus.FAILED
    assert "ValueError" in info.error

@pytest.mark.asyncio
async def test_job_chaining_then():
    jm = JobManager()
    
    async def parent_job():
        await asyncio.sleep(0.1)
        return "parent_done"
    
    def child_job_factory():
        async def child_job():
            await asyncio.sleep(0.1)
            return "child_done"
        return child_job()
    
    parent_id = jm.submit("parent", parent_job())
    child_id = jm.then(parent_id, "child", child_job_factory)
    
    parent_result = await jm.await_job(parent_id)
    assert parent_result == "parent_done"
    
    child_result = await jm.await_job(child_id)
    assert child_result == "child_done"
    
    parent_info = jm.get_info(parent_id)
    assert child_id in parent_info.children

@pytest.mark.asyncio
async def test_await_tree():
    jm = JobManager()
    
    async def root_job():
        return "root"
    
    async def child_job(val):
        return f"child_{val}"
    
    root_id = jm.submit("root", root_job())
    child1_id = jm.submit_child(root_id, "child1", child_job(1))
    child2_id = jm.submit_child(root_id, "child2", child_job(2))
    
    # Wait for the whole tree
    results = await jm.await_tree(root_id)
    
    # results is a tuple of (job_id, result) pairs
    # Since await_tree is recursive, it returns (root_id, root_res), *children_results
    
    results_dict = dict(results)
    assert results_dict[root_id] == "root"
    assert results_dict[child1_id] == "child_1"
    assert results_dict[child2_id] == "child_2"


@pytest.mark.asyncio
async def test_then_parent_failure_propagates_to_child():
    jm = JobManager()

    async def parent_job():
        raise ValueError("boom")

    def child_job_factory():
        async def child_job():
            return "unreachable"
        return child_job()

    parent_id = jm.submit("parent", parent_job())
    child_id = jm.then(parent_id, "child", child_job_factory)

    with pytest.raises(ValueError, match="boom"):
        await jm.await_job(parent_id)

    # Child should not hang forever when parent fails.
    with pytest.raises(RuntimeError, match="ParentFailed"):
        await asyncio.wait_for(jm.await_job(child_id), timeout=1.0)


@pytest.mark.asyncio
async def test_then_parent_cancellation_marks_child_cancelled():
    jm = JobManager()
    parent_started = asyncio.Event()

    async def parent_job():
        parent_started.set()
        await asyncio.sleep(10)

    def child_job_factory():
        async def child_job():
            return "unreachable"
        return child_job()

    parent_id = jm.submit("parent", parent_job())
    child_id = jm.then(parent_id, "child", child_job_factory)

    parent_task = jm.get_task(parent_id)
    assert parent_task is not None

    await parent_started.wait()
    parent_task.cancel()

    with pytest.raises(asyncio.CancelledError):
        await jm.await_job(parent_id)

    with pytest.raises(RuntimeError, match=r"ParentFailed\(CancelledError\)"):
        await asyncio.wait_for(jm.await_job(child_id), timeout=1.0)

    child_info = jm.get_info(child_id)
    assert child_info is not None
    assert child_info.status == JobStatus.CANCELLED
