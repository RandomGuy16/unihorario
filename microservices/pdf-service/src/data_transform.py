import json
import pathlib as path
import pdfplumber
import os
from config import PDF_DIR, JSON_DIR
from src.models.models import CareerCurriculumMetadata, CareerCurriculum, Year, Cycle, CourseSection, Schedule, \
    UniversityCurriculum
from typing import List


def extract_metadata(pdf_file: pdfplumber.PDF):
    first_page = pdf_file.pages[0]
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


def clean_table(table: List[List[str | None]]):
    for row in table:
        for i, cell in enumerate(row):
            if cell:
                row[i] = cell.replace("\n", " ")
            if cell == '':
                row[i] = None
    return table


def bundle_tables(pdf_file: pdfplumber.PDF):
    full_tables: List[List[List[str | None]]] = []

    for page in pdf_file.pages:
        for table in page.extract_tables():
            table = clean_table(table)
            if table[0] == ['Asignatura', 'Créd.', 'Sec.', 'Docente', 'Tope', 'Matri.', 'Aula', 'Día', 'Horas Clase']:
                full_tables.append(table)
            else:
                full_tables[-1].extend(table)

    return full_tables


def write_json(json_file: path.Path, career: CareerCurriculum):
    if not os.path.exists(JSON_DIR):
        os.mkdir(JSON_DIR)
    with open(json_file, "w") as f:
        json.dump(career.model_dump(), f, indent=4, ensure_ascii=False)


def _parse_pdf_sync(pdf_file: path.Path):
    """This function means cpu intensive work"""
    out: UniversityCurriculum = UniversityCurriculum(years=[])
    with pdfplumber.open(pdf_file) as pdf:
        metadata = extract_metadata(pdf)
        full_tables = bundle_tables(pdf)
        career_curriculums = CareerCurriculum(
            metadata=metadata,
            cycles=[]
        )

        out.years.append(Year(
            year=metadata.studyPlan,
            careerCurriculums=[career_curriculums]
        ))

        for i, table in enumerate(full_tables):
            curr_cycle = Cycle(
                cycle=f"CICLO {i + 1}",
                courseSections=[]
            )
            for row in table[1:]:
                course_section: CourseSection
                match row:
                    case [None, None, None, None, None, None, str(), str(), str()]:
                        course_section = curr_cycle.courseSections[-1]
                    case [str(), str(), str(), str(), str(), str(), str(), str(), str()]:
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
                        continue
                    case _:
                        raise Exception(f"Unexpected row: {row}")

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

            out.years[-1].careerCurriculums[-1].cycles.append(curr_cycle)

        # debug here
    write_json(path.Path(JSON_DIR, f"{metadata.school}.json"), out)
    return out


def main():
    # convert all files in pdf/
    pdf_files = list(path.Path(PDF_DIR).glob("*.pdf"))
    for file in pdf_files:
        _parse_pdf_sync(file)


if __name__ == '__main__':
    main()
