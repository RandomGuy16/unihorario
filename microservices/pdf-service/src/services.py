import asyncio
import pathlib as path
import json
from typing import Dict, List
from src.logger import logger
from src.models.models import CareerCurriculum, Catalog, CareerCatalogData
from src.data_transform import _parse_pdf_sync
from config import JSON_DIR, PDF_DIR


class CatalogService:
    data: Dict[str, CareerCatalogData]

    def __init__(self):
        self.data = {}
        logger.debug(JSON_DIR)

        # initialize catalog
        for file in JSON_DIR.glob("*.json"):
            career_data = CareerCatalogData(studyPlans=[], cycles=[], faculty="")
            
            with open(file, "r") as f:
                data: CareerCurriculum = CareerCurriculum.model_validate(json.load(f))
                for year in data.years:
                    career_data.faculty = year.metadata.faculty
                    career_data.studyPlans.append(year.metadata.studyPlan)
                    for cycle in year.cycles:
                        career_data.cycles.append(cycle.cycle)

            self.data[file.stem] = career_data

    async def get_catalog(self, school: str=""):
        return self.data


class CurriculumService:
    def __init__(self):
        pass

    async def get_curriculum(self, school):
        pass

    async def parse_pdf(self, pdf_file: path.Path) -> CareerCurriculum:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _parse_pdf_sync, pdf_file)

    async def parse_multiple_pdfs(self, pdf_files: List[path.Path]) -> List[CareerCurriculum]:
        tasks = [self.parse_pdf(pdf_file) for pdf_file in pdf_files]
        return await asyncio.gather(*tasks)

    async def process_all_pdfs_in_directory(self, directory: path.Path = PDF_DIR) -> List[CareerCurriculum]:
        """Process all PDFs in a directory concurrently"""
        pdf_files = list(path.Path(directory).glob("*.pdf"))
        return await self.parse_multiple_pdfs(pdf_files)


