import json
import pathlib as path
import pdfplumber
import os
from pdf_service.core.config import PDF_DIR_PATH, CAREERS_DIR_PATH, CATALOG_DIR_PATH
from pdf_service.core.logger import logger
from pdf_service.domain.models import CareerCurriculumMetadata, CareerCurriculum, Year, Cycle, CourseSection, Schedule, \
    UniversityCurriculum, CatalogCareerData, Catalog
from typing import BinaryIO, List


def _write_catalog(json_path: path.Path, catalog: Catalog):
    """
    Writes the provided catalog data to a JSON file at the specified path.

    This function ensures the existence of the directory where the JSON file
    will be stored. If the directory does not exist, it creates the directory
    structure before writing the file. The catalog data is serialized into
    JSON format with indentation for readability.

    :param json_path: The path where the catalog JSON file should be saved.
    :type json_path: path.Path
    :param catalog: The catalog object containing the data to be written to
        the JSON file.
    :type catalog: Catalog
    :return: None
    """
    if not os.path.exists(CATALOG_DIR_PATH):
        os.makedirs(CATALOG_DIR_PATH)
    with open(json_path, 'w') as catalog_file:
        json.dump(catalog.model_dump(), catalog_file, indent=4, ensure_ascii=False)


def create_catalog_from_university_curriculum(curriculum: UniversityCurriculum):
    """Build a catalog index from all stored career JSON files.

    Scans the careers directory, loads each curriculum JSON, and aggregates
    metadata (faculty, career name, study plans, and cycle names) into a
    single Catalog instance for quick lookup.

    :return: Catalog containing metadata summaries for each career.
    :rtype: Catalog
    """
    # initialize catalog
    catalog: Catalog = Catalog(careers={})

    for year in curriculum.years:
        for career in year.careerCurriculums:
            # Use metadata as the catalog source of truth.
            career_name = career.metadata.school
            study_plan = career.metadata.studyPlan
            cycles = [cycle.cycle for cycle in career.cycles]

            if career_name not in catalog.careers:
                catalog.careers[career_name] = CatalogCareerData(
                    studyPlans=[],
                    cycles=[],
                    faculty=career.metadata.faculty,
                    career=career.metadata.school
                )

            entry = catalog.careers[career_name]
            # entry.studyPlans is a list, but that list barely contains more than 3 items
            # so O(1)
            if study_plan not in entry.studyPlans:
                entry.studyPlans.append(study_plan)
            # same for cycles, upper limit is 10 - 12, so O(1)
            for cycle_name in cycles:
                if cycle_name not in entry.cycles:
                    entry.cycles.append(cycle_name)

    return catalog


def get_file_metadata(file: BinaryIO | path.Path):
    """Open a PDF and extract its curriculum metadata block.

    :param file: PDF stream or path on disk.
    :type file: BinaryIO | pathlib.Path
    :return: Parsed metadata fields from the PDF header.
    :rtype: CareerCurriculumMetadata
    """
    with pdfplumber.open(file) as pdf:
        return _parser_read_metadata(pdf)


def _parser_read_metadata(pdf_file: pdfplumber.PDF):
    """Extract metadata fields from the first page of the PDF.

    The metadata is expected to live in a fixed line range and use
    colon-separated key/value lines. This function trims and maps those
    values into a CareerCurriculumMetadata model.

    :param pdf_file: Open pdfplumber handle.
    :type pdf_file: pdfplumber.PDF
    :return: Parsed metadata values.
    :rtype: CareerCurriculumMetadata
    """
    try:
        first_page = pdf_file.pages[0]
        # Extract the fixed metadata block from the header area.
        meta_lines = first_page.extract_text().split("\n")[3:9]
        meta_lines = list(map(lambda line: line.split(":")[1].strip(), meta_lines))

        return CareerCurriculumMetadata(
            faculty=meta_lines[0],
            school=meta_lines[1],
            specialization=meta_lines[2],
            studyPlan=meta_lines[3],
            academicPeriod=meta_lines[4],
            datePrinted=meta_lines[5]
        )
    except Exception:
        logger.exception(f"Exception ocurred during metadata extraction from file")
        raise


def _parser_clean_table(table: List[List[str | None]]):
    """Normalize table cells by removing newlines and empty strings.

    :param table: Raw table from pdfplumber.
    :type table: list[list[str | None]]
    :return: Cleaned table with normalized cell content.
    :rtype: list[list[str | None]]
    """
    for row in table:
        for i, cell in enumerate(row):
            if cell:
                row[i] = cell.replace("\n", " ")
            if cell == '':
                row[i] = None
    return table


def _parser_bundle_tables(pdf_file: pdfplumber.PDF):
    """Merge paginated tables into full cycle tables.

    The PDF may split a cycle table across pages. When a table header row
    is detected, a new cycle table starts; otherwise rows are appended to
    the current cycle.

    :param pdf_file: Open pdfplumber handle.
    :type pdf_file: pdfplumber.PDF
    :return: List of full tables (one per cycle).
    :rtype: list[list[list[str | None]]]
    """
    full_tables: List[List[List[str | None]]] = []
    last_table : List[List[str | None]]       = []

    for page in pdf_file.pages:
        for table in page.extract_tables():
            table = _parser_clean_table(table)
            if table[0] == ['Asignatura', 'Créd.', 'Sec.', 'Docente', 'Tope', 'Matri.', 'Aula', 'Día', 'Horas Clase']:
                # New table header means a new cycle starts here.
                # last table reference helps avoid problems
                last_table = table
                full_tables.append(table)
            else:
                # Continuation of the previous cycle table.
                # full_tables[-1].extend(table)  to avoid the kind of problems this line used to generate
                last_table.extend(table)

    return full_tables


def _write_json(json_file: path.Path, career: UniversityCurriculum):
    """Persist a curriculum to disk in the careers directory.

    Creates the careers directory if it does not exist, then writes the
    serialized curriculum JSON with UTF-8 content preserved.

    :param json_file: Target path for the JSON file.
    :type json_file: pathlib.Path
    :param career: Curriculum data to serialize.
    :type career: UniversityCurriculum
    :return: None
    :rtype: None
    """
    if not os.path.exists(CAREERS_DIR_PATH):
        # Ensure target directory exists before writing.
        os.makedirs(CAREERS_DIR_PATH)
    with open(json_file, "w") as f:
        json.dump(career.model_dump(), f, indent=4, ensure_ascii=False)


def read_career(school: str):
    """Load a curriculum JSON by school name.

    :param school: School identifier used as the JSON filename stem.
    :type school: str
    :return: Parsed curriculum model from disk.
    :rtype: UniversityCurriculum
    """
    with open(path.Path(CAREERS_DIR_PATH, f"{school}.json"), "r") as f:
        # Validate against the Pydantic model for consistent shape.
        return UniversityCurriculum.model_validate(json.load(f))

def _parser_handle_row(row: List[str], course_section: CourseSection, curr_cycle: Cycle, metadata: CareerCurriculumMetadata):
    """Parse a single table row into course sections and schedules.

    The table rows can represent either a new course section, a schedule
    line for the most recent section, or an empty spacer row. The function
    updates the current cycle in-place by adding sections and schedules.

    :param row: Parsed row from a cycle table.
    :type row: list[str]
    :param course_section: Current section placeholder.
    :type course_section: CourseSection
    :param curr_cycle: Cycle being built.
    :type curr_cycle: Cycle
    :param metadata: Curriculum metadata used to populate study plan values.
    :type metadata: CareerCurriculumMetadata
    :raises Exception: When the row format does not match any expected pattern.
    :return: None
    :rtype: None
    """
    match row:
        case [None, None, None, None, None, None, str(), str(), str()]:
            # Schedule-only line for the most recent section.
            course_section = curr_cycle.courseSections[-1]
        case [str(), str(), str(), str(), str(), str(), str(), str(), str()]:
            # Full row describes a new course section.
            course_section = CourseSection(
                assignment=row[0].split(" ")[2],
                assignmentId=row[0].split(" ")[0],
                credits=int(float(row[1])),
                sectionNumber=int(row[2]),
                teacher=row[3],
                maxStudents=int(row[4]),
                courseVisible=True,
                studyPlan=metadata.academicPeriod.split(" ")[0],
                schedules=[]
            )
            curr_cycle.courseSections.append(course_section)
        case [None, None, None, None, None, None, None, None, None]:
            # Empty spacer line; nothing to record.
            return
        case _:
            raise Exception(f"Unexpected row: {row}")

    # Append schedule entry for the current row.
    course_section.schedules.append(Schedule(
        assignment=course_section.assignment,
        assignmentId=course_section.assignmentId,
        day=row[7],
        start=row[8].split(" ")[0],
        end=row[8].split(" ")[2],
        type="Teoría" if len(course_section.schedules) == 0 else "Práctica",
        scheduleNumber=len(course_section.schedules) + 1,
        sectionNumber=course_section.sectionNumber,
        teacher=course_section.teacher
    ))

def parse_pdf_sync(pdf_file: path.Path | BinaryIO):
    """Parse a PDF into a UniversityCurriculum without persistence side effects.

    This routine extracts metadata, groups tables by cycle, and builds the
    curriculum data model. Persistence is handled by repositories/services.

    :param pdf_file: PDF file path or stream.
    :type pdf_file: pathlib.Path | BinaryIO
    :return: Parsed curriculum model.
    :rtype: UniversityCurriculum
    """
    out: UniversityCurriculum = UniversityCurriculum(years=[])
    with pdfplumber.open(pdf_file) as pdf:
        metadata = _parser_read_metadata(pdf)
        full_tables = _parser_bundle_tables(pdf)
        career_curriculums = CareerCurriculum(
            metadata=metadata,
            cycles=[]
        )
        out.years.append(Year(
            year=metadata.studyPlan,
            careerCurriculums=[career_curriculums]
        ))

        for i, table in enumerate(full_tables):
            curr_cycle = Cycle(cycle=f"CICLO {i + 1}", courseSections=[])
            for row in table[1:]:
                course_section: CourseSection = CourseSection()
                _parser_handle_row(row, course_section, curr_cycle, metadata)

            out.years[-1].careerCurriculums[-1].cycles.append(curr_cycle)

    # parser is intentionally pure and returns the value to be persisted by the DB layer
    return out


def main():
    """Batch-convert all PDFs in PDF_DIR_PATH.

    Iterates over every PDF in the configured directory and runs the
    synchronous parser, producing JSON files in the careers directory.

    :return: None
    :rtype: None
    """
    # convert all files in pdf/
    pdf_files = list(path.Path(PDF_DIR_PATH).glob("*.pdf"))
    for file in pdf_files:
        # Run the synchronous parser for each file in the directory.
        parse_pdf_sync(file)


if __name__ == '__main__':
    main()
