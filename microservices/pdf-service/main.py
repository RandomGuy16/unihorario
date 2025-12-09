from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.services import CatalogService, CurriculumService
from src.logger import logger


catalog_service = CatalogService()
curriculum_service = CurriculumService()

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
    return curriculum_service.get_curriculum(school=school)
