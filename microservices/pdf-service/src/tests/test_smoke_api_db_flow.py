import pytest
from pdf_service.domain.models import AwaitJobResponse, Catalog, CreateCurriculumResponse, UniversityCurriculum
from tests.conftest import get_pdf_multipart_data


@pytest.mark.asyncio
async def test_smoke_post_curriculum_success(client, pdf_bytes):
    files = {
        "file": ("ingenieria_sistemas.pdf", pdf_bytes, "application/pdf")
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
        "file": ("ingenieria_sistemas.pdf", pdf_bytes, "application/pdf")
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


@pytest.mark.asyncio
async def test_smoke_send_multiple_careers(client):
    post_res_1 = await client.post(
        "/api/curriculum",
        files=get_pdf_multipart_data("ingenieria_sistemas")
    )
    assert post_res_1.status_code == 200

    post_res_2 = await client.post(
        "/api/curriculum",
        files=get_pdf_multipart_data("ingenieria_electronica")
    )
    assert post_res_2.status_code == 200

