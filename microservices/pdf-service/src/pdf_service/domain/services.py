import asyncio
from datetime import datetime, timezone
from time import perf_counter
import pathlib as path
from io import BytesIO
from enum import Enum
from itertools import chain
import socket
import struct
from typing import Dict, BinaryIO, Optional, Any, Callable, Coroutine

from pydantic.v1 import BaseModel, Field
from pdf_service.core.logger import logger
from pdf_service.core.config import (
    CLAMAV_ENABLED,
    CLAMAV_HOST,
    CLAMAV_PORT,
    CLAMAV_TIMEOUT_SECONDS,
    MAX_UPLOAD_SIZE_BYTES,
)
from pdf_service.domain.exceptions import (
    CurriculumNotFoundError,
    FileTooLargeError,
    MalwareDetectedError,
    ScannerUnavailableError,
    UnsupportedUploadTypeError,
    UploadValidationError,
)
from pdf_service.domain.models import UniversityCurriculum, Catalog, CreateCurriculumResponse, CareerCurriculum, \
    CatalogCareerData
from pdf_service.domain.data_transform import parse_pdf_sync, get_file_metadata, \
    create_catalog_from_university_curriculum
import uuid

from pdf_service.domain.uow import UnitOfWork


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
    started_at = perf_counter()
    logger.info("Job started", extra={"job_id": info.job_id, "kind": info.kind})
    try:
        info.result = await coro
        info.status = JobStatus.SUCCEEDED
        logger.info(
            "Job completed successfully",
            extra={
                "job_id": info.job_id,
                "kind": info.kind,
                "duration_ms": round((perf_counter() - started_at) * 1000, 2)
            }
        )
        return info.result
    except Exception as e:
        info.status = JobStatus.FAILED
        info.error = f"{type(e).__name__}: {e}"
        logger.exception(
            "Job failed",
            extra={
                "job_id": info.job_id,
                "kind": info.kind,
                "duration_ms": round((perf_counter() - started_at) * 1000, 2)
            }
        )
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

        # start the task
        task                = asyncio.create_task(_runner(info, coro))
        self._tasks[job_id] = task
        self._on_job_added(job_id)
        logger.info("Job submitted", extra={"job_id": job_id, "kind": kind})
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
            # helper to log a parent job failure and elevate it
            async def _raise_parent_failure(parent_error: BaseException):
                raise RuntimeError(
                    f"Parent job {parent_job_id} failed; child job {child_job_id} not started: "
                    f"{type(parent_error).__name__}: {parent_error}"
                )

            try:
                task.result()  # this will raise if the parent failed
                self._start_reserved(child_job_id, coro_factory())
                logger.info(
                    "Child job scheduled after parent completion",
                    extra={"job_id": child_job_id, "kind": kind, "parent_job_id": parent_job_id}
                )
            except asyncio.CancelledError as e:
                if child_info:
                    child_info.status = JobStatus.CANCELLED
                    child_info.error = f"ParentFailed({type(e).__name__}): {e}"
                    child_info.finished_at = datetime.now(timezone.utc)
                self._start_reserved(child_job_id, _raise_parent_failure(e))
                logger.exception(
                    "Parent job was cancelled before child could start",
                    extra={"job_id": child_job_id, "kind": kind, "parent_job_id": parent_job_id}
                )
            except Exception as e:
                # if in any case the parent job doesnt get cancelled and fails naturally
                # set the info to the children and elevate the error
                if child_info:
                    child_info.error = f"ParentFailed({type(e).__name__}): {e}"
                    child_info.finished_at = datetime.now(timezone.utc)
                self._start_reserved(child_job_id, _raise_parent_failure(e))
                logger.exception(
                    "Parent job failed; child job marked as failed",
                    extra={"job_id": child_job_id, "kind": kind, "parent_job_id": parent_job_id}
                )
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

    async def await_tree(self, job_id: str):
        """
        Waits for a job and all its descendant jobs to complete.

        :param job_id: The identifier of the root job in the tree.
        :return: A list containing pairs of (job_id, result) from all children in the tree.
        :raises KeyError: If the job_id is unknown.
        """
        
        if job_id not in self._job_events:
            raise KeyError(f"Unknown job id: {job_id}")
        job_event = self._job_events[job_id]
        await job_event.wait()

        # now the jobs should be in the corresponding dicts
        parent_info = self._jobs[job_id]
        parent = self._tasks[job_id]
        if not parent and not parent_info:
            raise KeyError(f"Unknown job id: {job_id}")

        try:
            result = await parent
            children_results = await asyncio.gather(*(self.await_tree(child) for child in parent_info.children))
            # this important line unpacks self.await_tree(child), because it returns a tuple of pairs
            all_children_pairs = tuple(chain.from_iterable(children_results))
            return ((parent_info.job_id, result),) + all_children_pairs
        except Exception:
            logger.exception("Error while awaiting job tree", extra={"job_id": job_id})
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
    def __init__(self, jobs: JobManager, uow_factory: Callable[..., UnitOfWork]):
        """
        Initializes the CatalogService.

        :param jobs: The JobManager instance for background tasks.
        """
        self.data: Catalog = Catalog(careers={})
        self.jobs          = jobs
        self.uow_factory   = uow_factory
        # Multiple parse jobs can trigger catalog refresh concurrently.
        # Serialize refreshes to avoid unique-key races on catalog upserts.
        self._refresh_lock = asyncio.Lock()

    async def init(self):
        """
        Initializes the service by loading the catalog data.
        """
        # Startup of the service from the main app
        logger.info("Initializing catalog service")
        await self.refresh_catalog()

    async def get_catalog(self):
        """
        Returns the current catalog data.

        :return: The Catalog object.
        """
        async with self.uow_factory() as uow:
            # get the catalog from the database
            return await uow.catalogs.get()

    async def add_career(self, career: CareerCurriculum):
        async with self.uow_factory() as uow:
            # retrieve the catalog and the current career instance
            catalog = await uow.catalogs.get()
            career_instance = catalog.careers.get(career.metadata.school)

            # if already added nothing to do
            if career_instance and career.metadata.studyPlan in career_instance.studyPlans:
                return

            career_data = CatalogCareerData(
                studyPlans=[career.metadata.studyPlan],
                cycles=[cycle.cycle for cycle in career.cycles],
                faculty=career.metadata.faculty,
                career=career.metadata.school
            )
            # if there are more study plans available, add them
            if career_instance:
                for study_plan in career_instance.studyPlans:
                    career_data.studyPlans.append(study_plan)

            # add metadata to the catalog
            await uow.catalogs.save(career_data)


    async def refresh_catalog(self):
        """
        Refreshes the catalog: gathers the careers in db and returns the catalog

        :return: The updated Catalog object.
        """
        async with self._refresh_lock:
            started_at = perf_counter()
            async with self.uow_factory() as uow:
                await self.build_catalog()
                self.data = await uow.catalogs.get()
            logger.info(
                "Catalog refresh complete",
                extra={
                    "career_count": len(self.data.careers),
                    "duration_ms": round((perf_counter() - started_at) * 1000, 2)
                }
            )
        return self.data

    def refresh_catalog_in_background(self) -> str:
        """
        Submits a background job to refresh the catalog.

        :return: The unique identifier for the refresh job.
        """
        return self.jobs.submit("refresh_catalog", self.refresh_catalog())

    async def build_catalog(self):
        """
            Creates the catalog orm objects with the year entities.

            :return: Nothing.
        """
        async with self.uow_factory() as uow:
            curriculum = await uow.curriculums.get()
            if curriculum is None:
                logger.info("Skipped catalog build because no curriculum data is stored")
                return
            catalog = create_catalog_from_university_curriculum(curriculum)
            for _, career in catalog.careers.items():
                await uow.catalogs.save(career)
            logger.info("Built catalog snapshot", extra={"career_count": len(catalog.careers)})


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
    def __init__(self, catalog_service: CatalogService, jobs: JobManager, uow_factory: Callable[..., UnitOfWork]):
        """
        Initializes the CurriculumService.

        :param catalog_service: The CatalogService instance.
        :param jobs: The JobManager instance.
        """
        self.catalog_service = catalog_service
        self.jobs            = jobs
        self.uow_factory     = uow_factory  # unit of work factory
        self.max_upload_size_bytes = MAX_UPLOAD_SIZE_BYTES
        self.clamav_enabled = CLAMAV_ENABLED

    @staticmethod
    def _is_pdf_filename(filename: Optional[str]) -> bool:
        return bool(filename and filename.lower().endswith(".pdf"))

    @staticmethod
    def _is_pdf_content_type(content_type: Optional[str]) -> bool:
        if not content_type:
            return False
        normalized = content_type.lower().split(";", 1)[0].strip()
        return normalized in {"application/pdf", "application/x-pdf"}

    def _read_pdf_bytes_with_limit(self, pdf: BinaryIO) -> bytes:
        chunks: list[bytes] = []
        total_read = 0

        while True:
            chunk = pdf.read(64 * 1024)
            if not chunk:
                break
            total_read += len(chunk)
            if total_read > self.max_upload_size_bytes:
                raise FileTooLargeError(
                    f"Uploaded file exceeds the {self.max_upload_size_bytes} byte limit"
                )
            chunks.append(chunk)

        if total_read == 0:
            raise UploadValidationError("Uploaded file is empty")

        return b"".join(chunks)

    @staticmethod
    def _validate_pdf_signature(pdf_bytes: bytes) -> None:
        if not pdf_bytes.startswith(b"%PDF-"):
            raise UnsupportedUploadTypeError("Uploaded file is not a valid PDF")

    def _validate_upload_metadata(self, *, filename: Optional[str], content_type: Optional[str]) -> None:
        if not self._is_pdf_filename(filename):
            raise UnsupportedUploadTypeError("Uploaded file must use a .pdf filename")

        if not self._is_pdf_content_type(content_type):
            raise UnsupportedUploadTypeError("Uploaded file must have content type application/pdf")

    @staticmethod
    def _scan_pdf_with_clamav_sync(pdf_bytes: bytes) -> None:
        try:
            with socket.create_connection(
                (CLAMAV_HOST, CLAMAV_PORT),
                timeout=CLAMAV_TIMEOUT_SECONDS,
            ) as sock:
                sock.sendall(b"zINSTREAM\0")
                offset = 0
                chunk_size = 64 * 1024
                while offset < len(pdf_bytes):
                    chunk = pdf_bytes[offset:offset + chunk_size]
                    sock.sendall(struct.pack("!I", len(chunk)))
                    sock.sendall(chunk)
                    offset += len(chunk)
                sock.sendall(struct.pack("!I", 0))
                response = sock.recv(4096).decode("utf-8", errors="replace").strip()
        except OSError as exc:
            raise ScannerUnavailableError("ClamAV scan failed because the scanner is unavailable") from exc

        if "FOUND" in response:
            raise MalwareDetectedError("Uploaded PDF was rejected by malware scanning")
        if "OK" not in response:
            raise ScannerUnavailableError(f"Unexpected ClamAV response: {response}")

    async def _scan_pdf_with_clamav(self, pdf_bytes: bytes) -> None:
        await asyncio.to_thread(self._scan_pdf_with_clamav_sync, pdf_bytes)

    async def get_curriculum(self, school, job_id: str = ''):
        """
        Retrieves the curriculum for a given school.

        If a job_id is provided, it waits for the result of that background job.
        Otherwise, it reads the curriculum data from the source.

        :param school: The name of the school or career.
        :param job_id: Optional background job identifier.
        :return: The UniversityCurriculum object.
        """
        async with self.uow_factory() as uow:
            curriculum: UniversityCurriculum
            if job_id:
                # await for the background job result
                logger.info("Resolving curriculum from job", extra={"job_id": job_id, "school": school})
                curriculum = await self.jobs.await_job(job_id)
            else:
                # if there's no job_id, just read without any problems... I hope so
                # return await asyncio.to_thread(read_career, school)
                curriculum = await uow.curriculums.get_by_school(school)

            if not curriculum:
                raise CurriculumNotFoundError(school=school)
            logger.info("Loaded curriculum", extra={"school": school, "year_count": len(curriculum.years)})
            return curriculum


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
        started_at = perf_counter()
        logger.info("Starting PDF parse", extra={"pdf_file": str(pdf_file)})
        result: UniversityCurriculum = await asyncio.to_thread(parse_pdf_sync, pdf_file)
        # send the result to the database
        async with self.uow_factory() as uow:
            await uow.curriculums.save(result)
        logger.info(
            "Persisted parsed curriculum",
            extra={
                "pdf_file": str(pdf_file),
                "year_count": len(result.years),
                "duration_ms": round((perf_counter() - started_at) * 1000, 2)
            }
        )

        return result


    # async def parse_multiple_pdfs(self, pdf_files: List[path.Path]) -> tuple[Any]:
    #     tasks = [self.parse_pdf(pdf_file) for pdf_file in pdf_files]
    #     return await asyncio.gather(*tasks)
    #
    # async def process_all_pdfs_in_directory(self, directory: path.Path = PDF_DIR_PATH) -> tuple[Any]:
    #     """Process all PDFs in a directory concurrently"""
    #     pdf_files = list(path.Path(directory).glob("*.pdf"))
    #     return await self.parse_multiple_pdfs(pdf_files)


    async def receive_curriculum(
        self,
        pdf: BinaryIO,
        *,
        filename: Optional[str] = None,
        content_type: Optional[str] = None,
    ):
        """
        Processes a newly uploaded curriculum PDF.

        Saves the PDF to a temporary file, extracts metadata, and submits
        a background job to parse the PDF and then refresh the catalog.

        :param pdf: The uploaded PDF file binary stream.
        :return: A CreateCurriculumResponse containing metadata and the parse job ID.
        :raises RuntimeError: If the parse job submission fails.
        """
        self._validate_upload_metadata(filename=filename, content_type=content_type)
        pdf_bytes = self._read_pdf_bytes_with_limit(pdf)
        pdf_size_bytes = len(pdf_bytes)
        logger.info("Read uploaded PDF into memory", extra={"pdf_size_bytes": pdf_size_bytes})
        self._validate_pdf_signature(pdf_bytes)
        if self.clamav_enabled:
            await self._scan_pdf_with_clamav(pdf_bytes)
            logger.info("Uploaded PDF passed ClamAV scan", extra={"pdf_size_bytes": pdf_size_bytes})
        # read the metadata, this is kinda fast compared to parsing the whole file
        metadata = await self.get_curriculum_metadata(BytesIO(pdf_bytes))
        logger.info(
            "Extracted curriculum metadata",
            extra={
                "school": metadata.school,
                "study_plan": metadata.studyPlan,
                "academic_period": metadata.academicPeriod
            }
        )
        parse_job_id = self.jobs.submit(
            kind="curriculum.parse_pdf",
            coro=self.parse_pdf(BytesIO(pdf_bytes))
        )
        if not parse_job_id:
            raise RuntimeError("Failed to submit parse job")
        # when parsing finishes, refresh the catalog as a job immediately executed after the parsing job
        catalog_refresh_job_id = self.jobs.then(
            parse_job_id,
            "curriculum.catalog.refresh_catalog",
            lambda: self.catalog_service.refresh_catalog()
        )
        logger.info(
            "Scheduled curriculum processing jobs",
            extra={
                "school": metadata.school,
                "parse_job_id": parse_job_id,
                "catalog_refresh_job_id": catalog_refresh_job_id
            }
        )
        # Finally, if everything worked, return the damn curriculum response
        return CreateCurriculumResponse(
            success=True,
            metadata=metadata,
            curriculumCreationJobId=parse_job_id,
            catalogRefreshJobId=catalog_refresh_job_id
        )
