import pytest
from pdf_service.domain.models import AwaitJobResponse, Catalog, CreateCurriculumResponse, UniversityCurriculum


@pytest.mark.asyncio
async def test_smoke_post_curriculum_success(client, pdf_bytes):
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
async def test_smoke_post_then_await_job(client, pdf_bytes):
    files = {
        "file": ("Programacion_Asignaturas.pdf", pdf_bytes, "application/pdf")
    }
    post_res = await client.post("/api/curriculum", files=files)
    assert post_res.status_code == 200
    create_response = CreateCurriculumResponse(**post_res.json())

    await_res = await client.get(f"/api/jobs/await_job/{create_response.curriculumCreationJobId}")
    assert await_res.status_code == 200
    payload = AwaitJobResponse(**await_res.json())
    assert payload.success is True
    parsed_curriculum = UniversityCurriculum.model_validate(payload.result)
    assert parsed_curriculum.years
