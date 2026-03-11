from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pdf_service.core.config import CORS_ORIGINS
from pdf_service.domain.exceptions import (
    CurriculumNotFoundError,
    FileTooLargeError,
    MalwareDetectedError,
    ScannerUnavailableError,
    UnsupportedUploadTypeError,
    UploadValidationError,
)
from pdf_service.domain.models import AwaitJobResponse, AwaitTreeResponse
from pdf_service.domain.services import CatalogService, CurriculumService, JobManager
from pdf_service.core.logger import logger
from contextlib import asynccontextmanager
from pdf_service.domain.db import engine, SessionLocal
from pdf_service.domain.uow import UnitOfWork


def uow_factory() -> UnitOfWork:
    """Create a UnitOfWork instance bound to the app session factory.

    :return: Unit of work configured with the shared async session maker.
    :rtype: UnitOfWork
    """
    return UnitOfWork(SessionLocal)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage FastAPI startup and shutdown lifecycle resources.

    On startup this function initializes DB connectivity and application
    services (job manager, catalog service, curriculum service), then warms
    catalog state. On shutdown it disposes the SQLAlchemy engine.

    :param app: FastAPI application instance.
    :type app: FastAPI
    :yield: Control back to FastAPI while the app is running.
    :rtype: AsyncIterator[None]
    """
    # now initialize the connection with the database
    logger.info("Starting PDF service")
    async with engine.begin() as conn:
        await conn.run_sync(lambda _: None)

    # define state for some services
    app.state.job_manager = JobManager()
    app.state.catalog_service = CatalogService(
        jobs=app.state.job_manager,
        uow_factory=uow_factory
    )
    app.state.curriculum_service = CurriculumService(
        app.state.catalog_service,
        jobs=app.state.job_manager,
        uow_factory=uow_factory
    )

    # instead of loading an ML model
    # we'll initialize the catalog service
    await app.state.catalog_service.init()
    logger.info("PDF service startup complete", extra={"origins": origins})

    # before startup
    yield
    # on shutdown
    logger.info("Shutting down PDF service")
    await engine.dispose()


origins = CORS_ORIGINS or ["http://localhost:3000"]
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/helloworld")
async def main():
    """Simple liveness endpoint.

    :return: Basic health payload.
    :rtype: dict[str, str]
    """
    return {"Hello": "World"}


@app.get("/api/catalog")
async def get_catalog():
    """Return current catalog data.

    :return: Catalog model serialized by FastAPI.
    :rtype: Catalog
    """
    return await app.state.catalog_service.get_catalog()


@app.get("/api/curriculum")
async def get_career_curriculum(school: str=''):
    """Fetch curriculum aggregate by school identifier.

    :param school: School/career key used to lookup curriculum.
    :type school: str
    :return: University curriculum for the requested school.
    :rtype: UniversityCurriculum
    :raises HTTPException: 404 if not found, 500 for unexpected errors.
    """
    try:
        return await app.state.curriculum_service.get_curriculum(school=school)
    except CurriculumNotFoundError as e:
        logger.warning("Curriculum not found", extra={"school": school})
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Unhandled error while fetching curriculum", extra={"school": school})
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/curriculum")
async def post_career_curriculum(file: UploadFile = File(...)):
    """Receive an official curriculum PDF and schedule parsing jobs.

    :param file: Uploaded PDF file from multipart form data.
    :type file: UploadFile
    :return: Metadata and background job identifiers.
    :rtype: CreateCurriculumResponse
    :raises HTTPException: 400 for invalid PDF shape, 500 for unexpected errors.
    """
    try:
        logger.info(
            "Received PDF upload",
            extra={"upload_filename": file.filename, "upload_content_type": file.content_type}
        )
        return await app.state.curriculum_service.receive_curriculum(
            file.file,
            filename=file.filename,
            content_type=file.content_type,
        )
    except FileTooLargeError as e:
        logger.warning(
            "Rejected oversized curriculum upload",
            extra={"upload_filename": file.filename, "upload_content_type": file.content_type}
        )
        raise HTTPException(status_code=413, detail=str(e))
    except UnsupportedUploadTypeError as e:
        logger.warning(
            "Rejected unsupported curriculum upload",
            extra={"upload_filename": file.filename, "upload_content_type": file.content_type}
        )
        raise HTTPException(status_code=415, detail=str(e))
    except MalwareDetectedError as e:
        logger.warning(
            "Rejected malware-positive curriculum upload",
            extra={"upload_filename": file.filename, "upload_content_type": file.content_type}
        )
        raise HTTPException(status_code=422, detail=str(e))
    except UploadValidationError as e:
        logger.warning(
            "Rejected invalid curriculum upload",
            extra={"upload_filename": file.filename, "upload_content_type": file.content_type}
        )
        raise HTTPException(status_code=400, detail=str(e))
    except ScannerUnavailableError:
        logger.exception(
            "Malware scanner unavailable during curriculum upload",
            extra={"upload_filename": file.filename, "upload_content_type": file.content_type}
        )
        raise HTTPException(status_code=503, detail="Malware scanner unavailable")
    except IndexError:
        logger.warning(
            "Rejected invalid curriculum PDF",
            extra={"upload_filename": file.filename, "upload_content_type": file.content_type}
        )
        raise HTTPException(
            status_code=400,
            detail="PDF uploaded is not an assignments programming from SUM")
    except Exception as e:
        logger.exception(
            "Unhandled error while receiving curriculum PDF",
            extra={"upload_filename": file.filename, "upload_content_type": file.content_type}
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/jobs/await_job/{job_id}")
async def await_job(job_id: str):
    """Wait for one background job and return its result.

    :param job_id: Job identifier to await.
    :type job_id: str
    :return: Wrapper containing success flag and job result payload.
    :rtype: AwaitJobResponse
    :raises HTTPException: 404 for unknown job id, 500 for job/runtime failures.
    """
    try:
        logger.info("Awaiting job result", extra={"job_id": job_id})
        # result = await job_manager.await_job(job_id)
        result = await app.state.curriculum_service.jobs.await_job(job_id)
        return AwaitJobResponse(
            success=True,
            result=result
        )
    except KeyError:
        logger.warning("Requested unknown job", extra={"job_id": job_id})
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    except Exception as e:
        logger.exception("Unhandled error while awaiting job", extra={"job_id": job_id})
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/await_tree/{job_id}")
async def await_tree(job_id: str):
    """Wait for a job and all chained child jobs to finish.

    :param job_id: Root job identifier.
    :type job_id: str
    :return: Wrapper with all job ids and results in the execution tree.
    :rtype: AwaitTreeResponse
    :raises HTTPException: 404 for unknown job id, 500 for job/runtime failures.
    """
    try:
        logger.info("Awaiting job tree", extra={"job_id": job_id})
        results = await app.state.job_manager.await_tree(job_id)
        return AwaitTreeResponse(
            success=True,
            results=[result[1] for result in results],
            jobIds=[result[0] for result in results]
        )
    except KeyError:
        logger.warning("Requested unknown job tree", extra={"job_id": job_id})
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    except Exception as e:
        logger.exception("Unhandled error while awaiting job tree", extra={"job_id": job_id})
        raise HTTPException(status_code=500, detail=str(e))
