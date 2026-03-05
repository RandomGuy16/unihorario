import pytest

from pdf_service.domain.models import AwaitJobResponse, CreateCurriculumResponse, UniversityCurriculum, Catalog
from tests.conftest import get_pdf_multipart_data


@pytest.mark.asyncio
async def test_e2e_upload_await_and_get_curriculum_by_school(client, pdf_bytes):
    files = {
        "file": ("ingenieria_sistemas.pdf", pdf_bytes, "application/pdf")
    }

    post_res = await client.post("/api/curriculum", files=files)
    assert post_res.status_code == 200
    create_response = CreateCurriculumResponse(**post_res.json())

    # get the curriculum via the job id
    parse_res = await client.get(f"/api/jobs/await_job/{create_response.curriculumCreationJobId}")
    assert parse_res.status_code == 200
    parse_payload = AwaitJobResponse(**parse_res.json())
    assert parse_payload.success is True
    parsed_curriculum = UniversityCurriculum.model_validate(parse_payload.result)
    assert parsed_curriculum.years

    # get the curriculum via the school name
    # school = parsed_curriculum.years[0].careerCurriculums[0].metadata.school
    school = create_response.metadata.school
    get_res = await client.get("/api/curriculum", params={"school": school})
    assert get_res.status_code == 200
    fetched_curriculum = UniversityCurriculum.model_validate(get_res.json())
    assert fetched_curriculum.years
    assert fetched_curriculum.years[0].careerCurriculums[0].metadata.school == school


@pytest.mark.asyncio
async def test_e2e_await_tree_returns_parse_and_refresh_jobs(client, pdf_bytes):
    files = {
        "file": ("ingenieria_sistemas.pdf", pdf_bytes, "application/pdf")
    }

    post_res = await client.post("/api/curriculum", files=files)
    assert post_res.status_code == 200
    create_response = CreateCurriculumResponse(**post_res.json())

    tree_res = await client.get(f"/api/jobs/await_tree/{create_response.curriculumCreationJobId}")
    assert tree_res.status_code == 200
    tree_payload = tree_res.json()
    assert tree_payload["success"] is True
    assert create_response.curriculumCreationJobId in tree_payload["jobIds"]
    assert create_response.catalogRefreshJobId in tree_payload["jobIds"]
    assert len(tree_payload["results"]) >= 2

@pytest.mark.asyncio
async def test_e2e_await_job_returns_updated_catalog(client, pdf_bytes):
    files = {
        "file": ("ingenieria_sistemas.pdf", pdf_bytes, "application/pdf")
    }

    post_res = await client.post("/api/curriculum", files=files)
    assert post_res.status_code == 200
    create_response = CreateCurriculumResponse(**post_res.json())

    catalog_job_id = create_response.catalogRefreshJobId
    catalog_res = await client.get(f"/api/jobs/await_job/{catalog_job_id}")
    assert catalog_res.status_code == 200
    catalog_payload = AwaitJobResponse(**catalog_res.json())
    assert catalog_payload.success is True
    assert catalog_payload.result is not None
    catalog = Catalog.model_validate(catalog_payload.result)
    assert create_response.metadata.school in catalog.careers


@pytest.mark.asyncio
async def test_e2e_send_multiple_careers_curriculums_and_refresh_catalog(client):
    # send ingenieria de sistemas curriculum
    post_res_1 = await client.post("/api/curriculum", files=get_pdf_multipart_data("ingenieria_sistemas"))
    assert post_res_1.status_code == 200
    # send ingenieria electronica curriculum
    post_res_2 = await client.post("/api/curriculum", files=get_pdf_multipart_data("ingenieria_electronica"))
    assert post_res_2.status_code == 200
    # check its catalog has both careers
    cr_2 = CreateCurriculumResponse.model_validate(post_res_2.json())
    catalog_2 = await client.get(f"/api/jobs/await_job/{cr_2.catalogRefreshJobId}")
    assert catalog_2.status_code == 200
    catalog_payload = AwaitJobResponse.model_validate(catalog_2.json())
    catalog = Catalog.model_validate(catalog_payload.result)
    assert cr_2.metadata.school in catalog.careers


