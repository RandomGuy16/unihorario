import asyncio
import pathlib as path
import json
from typing import Dict, List, Any
from src.logger import logger
from src.models import UniversityCurriculum, CareerCatalogData
from src.data_transform import _parse_pdf_sync
from config import CAREERS_DIR_PATH, PDF_DIR_PATH


class CatalogService:
    data: Dict[str, CareerCatalogData]

    def __init__(self):
        self.data = {}
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

            self.data[file.stem] = career_data

    def get_catalog(self):
        return {key: value.model_dump() for key, value in self.data.items()}


class CurriculumService:
    def __init__(self):
        pass

    async def get_curriculum(self, school):
        pass

    async def parse_pdf(self, pdf_file: path.Path) -> UniversityCurriculum:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _parse_pdf_sync, pdf_file)

    async def parse_multiple_pdfs(self, pdf_files: List[path.Path]) -> tuple[Any]:
        tasks = [self.parse_pdf(pdf_file) for pdf_file in pdf_files]
        return await asyncio.gather(*tasks)

    async def process_all_pdfs_in_directory(self, directory: path.Path = PDF_DIR_PATH) -> tuple[Any]:
        """Process all PDFs in a directory concurrently"""
        pdf_files = list(path.Path(directory).glob("*.pdf"))
        return await self.parse_multiple_pdfs(pdf_files)


