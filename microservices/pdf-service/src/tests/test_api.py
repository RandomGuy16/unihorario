import pytest
import asyncio
from httpx import ASGITransport, AsyncClient
from pdf_service.main import app

@pytest.fixture
async def client():
    # Use ASGITransport for testing FastAPI app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_helloworld(client):
    response = await client.get("/helloworld")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

@pytest.mark.asyncio
async def test_get_catalog(client):
    # Ensure catalog is initialized (or at least empty but valid)
    response = await client.get("/api/catalog")
    assert response.status_code == 200
    data = response.json()
    assert "careers" in data

@pytest.mark.asyncio
async def test_await_job_endpoint(client):
    # We can't easily submit a job via API without a PDF, 
    # but we can submit one directly via job_manager and then await it via API.
    from pdf_service.main import job_manager
    
    async def quick_job():
        await asyncio.sleep(0.1)
        return {"status": "done"}
    
    job_id = job_manager.submit("test_api_job", quick_job())
    
    response = await client.get(f"/api/jobs/await_job/{job_id}")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["result"] == {"status": "done"}

@pytest.mark.asyncio
async def test_await_job_not_found(client):
    response = await client.get("/api/jobs/await_job/non-existent-id")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_await_tree_endpoint(client):
    from pdf_service.main import job_manager
    
    async def root_job():
        return "root_val"
    
    async def child_job():
        return "child_val"
    
    root_id = job_manager.submit("root", root_job())
    child_id = job_manager.submit_child(root_id, "child", child_job())
    
    response = await client.get(f"/api/jobs/await_tree/{root_id}")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    # Results order might depend on implementation, but root is usually first or included
    assert "root_val" in res_json["results"]
    assert "child_val" in res_json["results"]
    assert root_id in res_json["jobIds"]
    assert child_id in res_json["jobIds"]
