from pathlib import Path

import pytest

from pdf_service.domain.data_transform import get_file_metadata, parse_pdf_sync
from pdf_service.core.config import FIXTURES_DIR_PATH

FIXTURES_DIR = Path(FIXTURES_DIR_PATH)

@pytest.mark.parametrize(
    "pdf_name, expected_school_substring",
    [
        ("ingenieria_sistemas.pdf", "Ingeniería De Sistemas"),
        ("ingenieria_electronica.pdf", "Ingeniería Electrónica"),
    ],
)


def test_get_file_metadata_reads_expected_school(pdf_name: str, expected_school_substring: str):
    metadata = get_file_metadata(FIXTURES_DIR / pdf_name)
    assert expected_school_substring in metadata.school


@pytest.mark.parametrize(
    "pdf_name",
    [
        "ingenieria_sistemas.pdf",
        "ingenieria_electronica.pdf",
    ],
)


def test_parse_pdf_sync_returns_non_empty_cycles_and_sections(pdf_name: str):
    curriculum = parse_pdf_sync(FIXTURES_DIR / pdf_name)

    assert curriculum.years, f"{pdf_name}: no years parsed"

    careers = curriculum.years[0].careerCurriculums
    assert careers, f"{pdf_name}: no career curriculums parsed"

    cycles = careers[0].cycles
    assert len(cycles) > 0, f"{pdf_name}: parser returned zero cycles"

    sections_count = sum(len(cycle.courseSections) for cycle in cycles)
    assert sections_count > 0, f"{pdf_name}: parser returned zero course sections"

