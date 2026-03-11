import pytest
import asyncio
from pdf_service.main import app
from pdf_service.domain.exceptions import MalwareDetectedError, ScannerUnavailableError

@pytest.mark.asyncio
async def test_helloworld(client):
    response = await client.get("/helloworld")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

@pytest.mark.asyncio
async def test_get_catalog(client):
    # Ensure catalog is initialized (or at least empty but valid)
    response = await client.get("/api/catalog")
    assert response.status_code == 200
    data = response.json()
    assert "careers" in data

@pytest.mark.asyncio
async def test_await_job_endpoint(client):
    # We can't easily submit a job via API without a PDF, 
    # but we can submit one directly via job_manager and then await it via API.
    
    async def quick_job():
        await asyncio.sleep(0.1)
        return {"status": "done"}
    
    job_id = app.state.job_manager.submit("test_api_job", quick_job())
    
    response = await client.get(f"/api/jobs/await_job/{job_id}")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["result"] == {"status": "done"}

@pytest.mark.asyncio
async def test_await_job_not_found(client):
    response = await client.get("/api/jobs/await_job/non-existent-id")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_await_tree_endpoint(client):

    async def root_job():
        return "root_val"
    
    async def child_job():
        return "child_val"
    
    root_id = app.state.job_manager.submit("root", root_job())
    child_id = app.state.job_manager.submit_child(root_id, "child", child_job())
    
    response = await client.get(f"/api/jobs/await_tree/{root_id}")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    # Results order might depend on implementation, but root is usually first or included
    assert "root_val" in res_json["results"]
    assert "child_val" in res_json["results"]
    assert root_id in res_json["jobIds"]
    assert child_id in res_json["jobIds"]


@pytest.mark.asyncio
async def test_upload_rejects_non_pdf_content_type(client):
    files = {
        "file": ("curriculum.pdf", b"%PDF-1.4\nfake", "text/plain")
    }

    response = await client.post("/api/curriculum", files=files)
    assert response.status_code == 415
    assert "application/pdf" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_invalid_pdf_signature(client):
    files = {
        "file": ("curriculum.pdf", b"not really a pdf", "application/pdf")
    }

    response = await client.post("/api/curriculum", files=files)
    assert response.status_code == 415
    assert "valid PDF" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_oversized_pdf(client):
    oversized_pdf = b"%PDF-1.4\n" + (b"0" * (app.state.curriculum_service.max_upload_size_bytes + 1))
    files = {
        "file": ("curriculum.pdf", oversized_pdf, "application/pdf")
    }

    response = await client.post("/api/curriculum", files=files)
    assert response.status_code == 413


@pytest.mark.asyncio
async def test_upload_rejects_malware_positive_pdf(client, monkeypatch):
    async def fake_scan(_: bytes) -> None:
        raise MalwareDetectedError("Uploaded PDF was rejected by malware scanning")

    monkeypatch.setattr(app.state.curriculum_service, "clamav_enabled", True)
    monkeypatch.setattr(app.state.curriculum_service, "_scan_pdf_with_clamav", fake_scan)

    files = {
        "file": ("curriculum.pdf", b"%PDF-1.4\nfake", "application/pdf")
    }

    response = await client.post("/api/curriculum", files=files)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upload_returns_503_when_scanner_is_unavailable(client, monkeypatch):
    async def fake_scan(_: bytes) -> None:
        raise ScannerUnavailableError("scanner down")

    monkeypatch.setattr(app.state.curriculum_service, "clamav_enabled", True)
    monkeypatch.setattr(app.state.curriculum_service, "_scan_pdf_with_clamav", fake_scan)

    files = {
        "file": ("curriculum.pdf", b"%PDF-1.4\nfake", "application/pdf")
    }

    response = await client.post("/api/curriculum", files=files)
    assert response.status_code == 503
