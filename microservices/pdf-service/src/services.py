import asyncio
import pathlib as path
import json
from typing import List, Any, BinaryIO

from src.logger import logger
from src.models import UniversityCurriculum, CareerCatalogData, Catalog, CreateCurriculumResponse
from src.data_transform import _parse_pdf_sync, _read_career, get_file_metadata
from config import CAREERS_DIR_PATH, PDF_DIR_PATH


class CatalogService:
    data: Catalog

    def __init__(self):
        self.data = Catalog(careers={})
        self.refresh_catalog()

    def get_catalog(self):
        return self.data

    def refresh_catalog(self):
        logger.debug(CAREERS_DIR_PATH)

        # initialize catalog
        for file in CAREERS_DIR_PATH.glob("*.json"):
            career_data = CareerCatalogData(studyPlans=[], cycles=[], faculty="", career="")

            with open(file, "r") as f:
                data: UniversityCurriculum = UniversityCurriculum.model_validate(json.load(f))
                for year in data.years:
                    for career in year.careerCurriculums:
                        career_data.career = career.metadata.school
                        career_data.faculty = career.metadata.faculty
                        career_data.studyPlans.append(career.metadata.studyPlan)
                        for cycle in career.cycles:
                            career_data.cycles.append(cycle.cycle)

            self.data.careers[file.stem] = career_data


    def has_career(self, career: str):
        return career in self.data.careers


class CurriculumService:

    def __init__(self, catalog_service: CatalogService):
        self.catalog_service = catalog_service

    async def get_curriculum(self, school):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _read_career, school)

    async def get_curriculum_metadata(self, pdf: BinaryIO):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, get_file_metadata, pdf)

    async def parse_pdf(self, pdf_file: path.Path | BinaryIO) -> UniversityCurriculum:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _parse_pdf_sync, pdf_file)

    async def parse_multiple_pdfs(self, pdf_files: List[path.Path]) -> tuple[Any]:
        tasks = [self.parse_pdf(pdf_file) for pdf_file in pdf_files]
        return await asyncio.gather(*tasks)

    async def process_all_pdfs_in_directory(self, directory: path.Path = PDF_DIR_PATH) -> tuple[Any]:
        """Process all PDFs in a directory concurrently"""
        pdf_files = list(path.Path(directory).glob("*.pdf"))
        return await self.parse_multiple_pdfs(pdf_files)

    async def receive_curriculum(self, pdf: BinaryIO):
        metadata = await self.get_curriculum_metadata(pdf)
        self.catalog_service.refresh_catalog()

        return CreateCurriculumResponse(
            success=True,
            metadata=metadata
        )


