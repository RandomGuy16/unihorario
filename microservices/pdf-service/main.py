from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from src.services import CatalogService, CurriculumService
from src.logger import logger


catalog_service = CatalogService()
curriculum_service = CurriculumService(catalog_service)

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
    return await curriculum_service.get_curriculum(school=school)

@app.post("/api/curriculum")
async def post_career_curriculum(file: UploadFile = File(...)):
    logger.info(f"Received pdf upload")
    return await curriculum_service.receive_curriculum(file)
