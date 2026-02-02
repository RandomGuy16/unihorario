import asyncio
import tempfile
from datetime import datetime, timezone
import pathlib as path
from enum import Enum
from typing import Dict, BinaryIO, Optional, Any, Callable, Coroutine, Tuple
from pydantic.v1 import BaseModel, Field
from pdf_service.core.logger import logger
from pdf_service.domain.models import UniversityCurriculum, Catalog, CreateCurriculumResponse
from pdf_service.domain.data_transform import parse_pdf_sync, read_career, get_file_metadata, create_catalog
from pdf_service.core.config import CAREERS_DIR_PATH
import uuid


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobInfo(BaseModel):
    job_id: str
    kind: str
    status: JobStatus = JobStatus.QUEUED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    result: Any = None
    children: list[str] = Field(default_factory=list)


class JobInfoTree(BaseModel):
    job_id: str
    kind: str
    status: JobStatus = JobStatus.QUEUED
    children: list["JobInfoTree"] = Field(default_factory=list)


async def _runner(info: JobInfo, coro: Coroutine[Any, Any, Any]) -> None:
    """
    Executes a coroutine and updates the JobInfo status and timestamps.

    :param info: The JobInfo object to update.
    :param coro: The coroutine to execute.
    :return: The result of the coroutine.
    """
    info.status = JobStatus.RUNNING
    info.started_at = datetime.now(timezone.utc)
    try:
        info.result = await coro
        info.status = JobStatus.SUCCEEDED
        return info.result
    except Exception as e:
        info.status = JobStatus.FAILED
        info.error = f"{type(e).__name__}: {e}"
        raise
    finally:
        info.finished_at = datetime.now(timezone.utc)


class JobManager:
    """
    Manages background jobs, allowing submission, chaining, and status tracking.
    """
    def __init__(self):
        """
        Initializes the JobManager with empty job and task registries.
        """
        self._jobs      : Dict[str, JobInfo]       = {}
        self._tasks     : Dict[str, asyncio.Task]  = {}
        self._job_events: Dict[str, asyncio.Event] = {}

    def _on_job_added(self, job_id: str):
        """some docstring"""
        if job_id in self._job_events:
            self._job_events[job_id].set()

    def _start_reserved(self, job_id: str, coro: Coroutine[Any, Any, Any]) -> str:
        """
        Starts a coroutine for a job_id that already exists in self._jobs.

        :param job_id: The identifier of the existing job.
        :param coro: The coroutine to associate with the job.
        :return: The job identifier.
        :raises ValueError: If the job_id does not exist.
        """
        info = self.get_info(job_id)
        if not info:
            raise ValueError(f"Cannot start reserved job {job_id} because it does not exist.")
        # start the task
        task = asyncio.create_task(_runner(info, coro))
        self._tasks[job_id] = task
        # never forget to set the job_event
        self._on_job_added(job_id)
        return job_id

    def submit(self, kind: str, coro: Coroutine[Any, Any, Any]) -> str:
        """
        Submits a coroutine as a new job to be executed and tracks its status and result. Each submitted
        job is assigned a unique identifier and its lifecycle is managed until completion.

        :param kind: A string representing the type or nature of the job being submitted.
        :param coro: The coroutine object representing the asynchronous task to be executed.
        :return: A string containing the unique identifier for the submitted job.
        """
        # create id and info for the new job
        job_id             = uuid.uuid4().hex
        info               = JobInfo(job_id=job_id, kind=kind, status=JobStatus.QUEUED)
        self._jobs[job_id] = info  # store it
        # submit a job event
        # since the submitting logic is inside a lot of helpers
        # this job event is needed
        self._job_events[job_id] = asyncio.Event()
        logger.debug(job_id)
        logger.info(self._job_events[job_id])

        # start the task
        task                = asyncio.create_task(_runner(info, coro))
        self._tasks[job_id] = task
        self._on_job_added(job_id)
        logger.info(self._job_events[job_id])
        logger.info(f"Job ({kind}) submitted successfully, running in thread now.")
        return job_id

    def submit_child(self, parent_job_id: str, kind: str, coro: Coroutine[Any, Any, Any]) -> str:
        """
        Submits a child task associated with a parent job ID. The child task is linked
        to the parent job after submission.

        :param parent_job_id: The ID of the parent job to which the child task will
            be attached.
        :type parent_job_id: str
        :param kind: The type or category of the child task to be submitted.
        :type kind: str
        :param coro: An asynchronous coroutine representing the child task to be
            submitted.
        :type coro: asyncio.coroutines.Coroutine[Any, Any, Any]
        :return: The unique identifier of the submitted child task.
        :rtype: str
        :raises ValueError: If the parent job ID does not correspond to an existing
            submitted job.
        """
        if not self.get_info(parent_job_id):
            raise ValueError(
                f"Cannot add child task to job {parent_job_id} because it has not been submitted yet."
            )

        child_job_id = self.submit(kind, coro)
        self.link_child(parent_job_id, child_job_id)
        return child_job_id

    def then(self, parent_job_id: str, kind: str, coro_factory: Callable[[], Coroutine[Any, Any, Any]]) -> str:
        """
        Schedules a child job to run after the parent job successfully completes.

        :param parent_job_id: The ID of the parent job.
        :param kind: The type or category of the child job.
        :param coro_factory: A callable that returns a coroutine to be executed after the parent.
        :return: The unique identifier for the child job.
        :raises ValueError: If the parent job ID does not exist.
        """
        parent_job = self.get_task(parent_job_id)
        if not parent_job:
            raise ValueError(
                f"Cannot chain job {parent_job_id} because it has not been submitted yet."
            )
        # generate job information for the future task and link immediately
        child_job_id = uuid.uuid4().hex
        self._jobs[child_job_id] = JobInfo(job_id=child_job_id, kind=kind)
        self._job_events[child_job_id] = asyncio.Event()  # create a event for the future job
        self.link_child(parent_job_id, child_job_id)

        def _enqueue_child(task: asyncio.Task) -> None:
            child_info = self.get_info(child_job_id)
            try:
                task.result()  # this will raise if the parent failed
                self._start_reserved(child_job_id, coro_factory())
                logger.info(f"Child job ({kind}) scheduled after parent job finishes")
            except asyncio.CancelledError as e:
                if child_info:
                    child_info.status = JobStatus.CANCELLED
                    child_info.error = f"ParentFailed({type(e).__name__}): {e}"
                    child_info.finished_at = datetime.now(timezone.utc)
                logger.exception("Error occurred during parent job execution: child job not started")
            except Exception:
                logger.exception("Error occurred during child job execution")
                # logger.exception(f"{e.__class__.__name__}: {e}")
        parent_job.add_done_callback(_enqueue_child)
        return child_job_id


    def link_child(self, parent_job_id: str, child_job_id: str) -> None:
        """
        Links a child job to a parent job.

        :param parent_job_id: The identifier of the parent job.
        :param child_job_id: The identifier of the child job.
        """
        parent = self.get_info(parent_job_id)
        if parent:
            parent.children.append(child_job_id)

    def get_info(self, job_id: str) -> Optional[JobInfo]:
        """
        Retrieves the information (metadata) for a given job.

        :param job_id: The identifier of the job.
        :return: A JobInfo object if found, otherwise None.
        """
        return self._jobs.get(job_id)

    def get_task(self, job_id: str) -> Optional[asyncio.Task]:
        """
        Retrieves the asyncio Task associated with a job.

        :param job_id: The identifier of the job.
        :return: An asyncio.Task object if found, otherwise None.
        """
        return self._tasks.get(job_id)

    async def await_job(self, job_id: str) -> Any:
        """
        Waits for a job to complete and returns its result.

        :param job_id: The identifier of the job.
        :return: The result of the job.
        :raises KeyError: If the job_id is unknown.
        """
        if job_id not in self._job_events:
            raise KeyError(f"Unknown job id: {job_id}")
        job_event = self._job_events[job_id]

        # wait for the job to be submitted to self._tasks
        await job_event.wait()
        # now the job should be in ._tasks
        task = self._tasks.get(job_id)
        if not task:
            raise KeyError(f"Unknown job id: {job_id}")
        return await task

    async def await_tree(self, job_id: str) -> Tuple[Tuple[str, Any], ...]:
        """
        Waits for a job and all its descendant jobs to complete.

        :param job_id: The identifier of the root job in the tree.
        :return: A list containing pairs of (job_id, result) from all children in the tree.
        :raises KeyError: If the job_id is unknown.
        """
        
        job_event = self._job_events[job_id]
        if job_event not in self._job_events:
            raise KeyError(f"Unknown job id: {job_id}")
        await job_event.wait()

        # now the jobs should be in the corresponding dicts
        parent_info = self._jobs[job_id]
        parent = self._tasks[job_id]
        if not parent and not parent_info:
            raise KeyError(f"Unknown job id: {job_id}")

        try:
            result = await parent
            children_results = await asyncio.gather(*(self.await_tree(child) for child in parent_info.children))
            return (parent_info.job_id, result), *children_results
        except Exception as e:
            logger.exception(f"Error occurred during tree job execution: {e}")
            raise


    def _get_tree_dfs(self, job_id: str, visited: set[str]) -> JobInfoTree:
        """Performs depth‑first traversal to build job tree"""
        job_info = self._jobs[job_id]
        tree_node = JobInfoTree(job_id=job_id, kind=job_info.kind, status=job_info.status)
        for child in self._jobs[job_id].children:
            if child in visited:
                continue
            visited.add(child)
            tree_node.children.append(self.get_tree(child))

        return tree_node


    def get_tree(self, job_id: str) -> JobInfoTree:
        """
        Builds a hierarchical representation of a job and its children.

        :param job_id: The identifier of the root job.
        :return: A JobInfoTree object representing the job hierarchy.
        """
        visited = set()
        # children_job_ids = deque([job_id])
        root_node = self._get_tree_dfs(job_id, visited)

        return root_node


class CatalogService:
    """
    Service for managing the career catalog.
    """
    def __init__(self, jobs: JobManager):
        """
        Initializes the CatalogService.

        :param jobs: The JobManager instance for background tasks.
        """
        self.data: Catalog = Catalog(careers={})
        self.jobs          = jobs

    async def init(self):
        """
        Initializes the service by loading the catalog data.
        """
        # Startup of the service from the main app
        await self.refresh_catalog()

    def get_catalog(self):
        """
        Returns the current catalog data.

        :return: The Catalog object.
        """
        return self.data

    async def refresh_catalog(self):
        """
        Refreshes the catalog by reading the careers directory.

        :return: The updated Catalog object.
        """
        logger.debug(CAREERS_DIR_PATH)
        self.data = await asyncio.to_thread(create_catalog)
        return self.data

    def refresh_catalog_in_background(self) -> str:
        """
        Submits a background job to refresh the catalog.

        :return: The unique identifier for the refresh job.
        """
        return self.jobs.submit("refresh_catalog", self.refresh_catalog())

    def has_career(self, career: str):
        """
        Checks if a career exists in the catalog.

        :param career: The name of the career to check.
        :return: True if the career exists, False otherwise.
        """
        return career in self.data.careers


class CurriculumService:
    """
    Service for processing and retrieving university curricula.
    """
    def __init__(self, catalog_service: CatalogService, jobs: JobManager):
        """
        Initializes the CurriculumService.

        :param catalog_service: The CatalogService instance.
        :param jobs: The JobManager instance.
        """
        self.catalog_service = catalog_service
        self.jobs            = jobs

    async def get_curriculum(self, school, job_id: str = ''):
        """
        Retrieves the curriculum for a given school.

        If a job_id is provided, it waits for the result of that background job.
        Otherwise, it reads the curriculum data from the source.

        :param school: The name of the school or career.
        :param job_id: Optional background job identifier.
        :return: The UniversityCurriculum object.
        """
        if job_id:
            # await for the background job result
            return await self.jobs.await_job(job_id)
        # if there's no job_id, just read without any problems... I hope so
        return await asyncio.to_thread(read_career, school)

    async def get_curriculum_metadata(self, pdf: BinaryIO | path.Path):
        """
        Extracts metadata from a curriculum PDF file.

        :param pdf: The PDF file content or path.
        :return: Metadata extracted from the PDF.
        """
        return await asyncio.to_thread(get_file_metadata, pdf)

    async def parse_pdf(self, pdf_file: path.Path | BinaryIO) -> UniversityCurriculum:
        """
        Parses a curriculum PDF file into a UniversityCurriculum object.

        :param pdf_file: The path or binary content of the PDF file.
        :return: The parsed UniversityCurriculum.
        """
        return await asyncio.to_thread(parse_pdf_sync, pdf_file)


    # async def parse_multiple_pdfs(self, pdf_files: List[path.Path]) -> tuple[Any]:
    #     tasks = [self.parse_pdf(pdf_file) for pdf_file in pdf_files]
    #     return await asyncio.gather(*tasks)
    #
    # async def process_all_pdfs_in_directory(self, directory: path.Path = PDF_DIR_PATH) -> tuple[Any]:
    #     """Process all PDFs in a directory concurrently"""
    #     pdf_files = list(path.Path(directory).glob("*.pdf"))
    #     return await self.parse_multiple_pdfs(pdf_files)


    async def receive_curriculum(self, pdf: BinaryIO):
        """
        Processes a newly uploaded curriculum PDF.

        Saves the PDF to a temporary file, extracts metadata, and submits
        a background job to parse the PDF and then refresh the catalog.

        :param pdf: The uploaded PDF file binary stream.
        :return: A CreateCurriculumResponse containing metadata and the parse job ID.
        :raises RuntimeError: If the parse job submission fails.
        """
        # always open these files in a temporary file
        # and never from the request stream in a background task
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
            tmp_pdf.write(pdf.read())  # write the file
            tmp_path = path.Path(tmp_pdf.name)
        # read the metadata, this is kinda fast compared to parsing the whole file
        metadata     = await self.get_curriculum_metadata(path.Path(tmp_path))
        parse_job_id = self.jobs.submit(
            kind="curriculum.parse_pdf",
            coro=self.parse_pdf(tmp_path)
        )
        if not parse_job_id:
            raise RuntimeError("Failed to submit parse job")
        # when parsing finishes, refresh the catalog as a job immediately executed after the parsing job
        catalog_refresh_job_id = self.jobs.then(
            parse_job_id,
            "curriculum.catalog.refresh_catalog",
            lambda: self.catalog_service.refresh_catalog()
        )
        # Finally, if everything worked, return the damn curriculum response
        return CreateCurriculumResponse(
            success=True,
            metadata=metadata,
            curriculumCreationJobId=parse_job_id,
            catalogRefreshJobId=catalog_refresh_job_id
        )
