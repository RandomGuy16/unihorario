from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.models import AwaitTreeResponse
from src.services import CatalogService, CurriculumService, JobManager
from src.logger import logger

job_manager        = JobManager()
catalog_service    = CatalogService(jobs=job_manager)
curriculum_service = CurriculumService(catalog_service, jobs=job_manager)

origins=["*"]
app = FastAPI()
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
    return catalog_service.get_catalog()


@app.get("/api/curriculum")
async def get_career_curriculum(school: str=''):
    try:
        return await curriculum_service.get_curriculum(school=school)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/curriculum")
async def post_career_curriculum(file: UploadFile = File(...)):
    try:
        logger.info(f"Received pdf upload")
        return await curriculum_service.receive_curriculum(file.file)
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))


@app.get("api/jobs/await_job/{job_id}")
async def await_job(job_id: str):
    try:
        logger.info(f"Awaiting job {job_id}")
        result = await job_manager.await_job(job_id)
        return dict(
            status="OK",
            result=result
        )
    except KeyError:
        return HTTPException(status_code=404, detail=f"Job {job_id} not found")
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/await_tree/{job_id}")
async def await_tree(job_id: str):
    try:
        results = await job_manager.await_tree(job_id)
        return AwaitTreeResponse(
            success=True,
            results=[result[1] for result in results],
            jobIds=[result[0] for result in results]
        )
    except KeyError:
        return HTTPException(status_code=404, detail=f"Job {job_id} not found")
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))
