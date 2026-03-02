import time
from pathlib import Path

import pytest
from pdf_service.domain.models import CreateCurriculumResponse, Catalog
from pdf_service.core.config import TESTS_DIR_PATH
from tests.conftests import client


@pytest.mark.asyncio
async def test_smoke_post_curriculum_success(client):
    pdf_path = Path.joinpath(TESTS_DIR_PATH, "fixtures", "Programacion_Asignaturas.pdf")
    pdf_bytes = pdf_path.read_bytes()

    files = {
        "file": ("Programacion_Asignaturas.pdf", pdf_bytes, "application/pdf")
    }
    res = await client.post("/api/curriculum", files=files)
    assert res.status_code == 200
    create_response = CreateCurriculumResponse(**res.json())
    assert create_response.success is True
    assert create_response.curriculumCreationJobId is not None
    assert create_response.catalogRefreshJobId is not None
    assert create_response.metadata.school is not None


@pytest.mark.asyncio
async def test_smoke_get_catalog(client):
    res = await client.get("/api/catalog")
    assert res.status_code == 200
    catalog = Catalog(**res.json())
    assert hasattr(catalog, "careers")

@pytest.mark.asyncio
async def test_smoke_get_curriculum(client):
    res = await client.get("/api/curriculum")
    assert res.status_code == 404

    pdf_path = Path.joinpath(TESTS_DIR_PATH, "fixtures", "Programacion_Asignaturas.pdf")
    pdf_bytes = pdf_path.read_bytes()

    files = {
        "file": ("Programacion_Asignaturas.pdf", pdf_bytes, "application/pdf")
    }
    res = await client.post("/api/curriculum", files=files)
    assert res.status_code == 200

    time.sleep(1)

    res = await client.get("/api/curriculum/1 - E.P. De Ingenier\xc3\xada De Sistemas")
    assert res.status_code == 200

