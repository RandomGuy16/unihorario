# Testing Unihorario PDF Service

This project uses `pytest` and `pytest-asyncio` for testing. `httpx` is used for testing the FastAPI endpoints.

## Prerequisites

You need to install the following packages:

```bash
pip install pytest pytest-asyncio
```

## Running Tests

To run all tests, execute the following command from the project root:

```bash
pytest
```

To run a specific test file:

```bash
pytest tests/test_job_manager.py
pytest tests/test_api.py
```

## Test Structure

- `tests/test_job_manager.py`: Unit tests for the `JobManager` class, including background job submission, chaining with `then`, and awaiting job trees. It verifies the `asyncio.Event` synchronization logic.
- `tests/test_api.py`: Integration tests for the FastAPI endpoints using `httpx.AsyncClient`. These tests verify the endpoints without needing to manually start the web server.

## Features Covered

- **Job Manager**: Submission, status tracking, and result retrieval.
- **Asyncio Events**: Testing the `await_job` and `await_tree` functionality which relies on `asyncio.Event`.
- **FastAPI Endpoints**: `/helloworld`, `/api/catalog`, and the job awaiting endpoints.
