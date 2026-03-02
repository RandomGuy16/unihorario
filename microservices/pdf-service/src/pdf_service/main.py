from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pdf_service.domain.exceptions import CurriculumNotFoundError
from pdf_service.domain.models import AwaitJobResponse, AwaitTreeResponse
from pdf_service.domain.services import CatalogService, CurriculumService, JobManager
from pdf_service.core.logger import logger
from contextlib import asynccontextmanager
from pdf_service.domain.db import engine, SessionLocal
from pdf_service.domain.uow import UnitOfWork


def uow_factory() -> UnitOfWork:
    return UnitOfWork(SessionLocal)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # now initialize the connection with the database
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

    # before startup
    yield
    # on shutdown
    await engine.dispose()


origins=["*"]
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
    return {"Hello": "World"}


@app.get("/api/catalog")
async def get_catalog():
    return await app.state.catalog_service.get_catalog()


@app.get("/api/curriculum")
async def get_career_curriculum(school: str=''):
    try:
        return await app.state.curriculum_service.get_curriculum(school=school)
    except CurriculumNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/curriculum")
async def post_career_curriculum(file: UploadFile = File(...)):
    try:
        logger.info(f"Received pdf upload")
        return await app.state.curriculum_service.receive_curriculum(file.file)
    except IndexError:
        raise HTTPException(
            status_code=400,
            detail="PDF uploaded is not an assignments programming from SUM")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs/await_job/{job_id}")
async def await_job(job_id: str):
    try:
        logger.info(f"Awaiting job {job_id}")
        # result = await job_manager.await_job(job_id)
        result = await app.state.curriculum_service.jobs.await_job(job_id)
        return AwaitJobResponse(
            success=True,
            result=result
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/await_tree/{job_id}")
async def await_tree(job_id: str):
    try:
        logger.info(f"Awaiting tree, root: {job_id}")
        results = await app.state.job_manager.await_tree(job_id)
        return AwaitTreeResponse(
            success=True,
            results=[result[1] for result in results],
            jobIds=[result[0] for result in results]
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
