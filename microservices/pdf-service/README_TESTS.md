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

## Docker setup
To run db tests, you need to run a postgres container. The following command initializes the db.

```bash
sudo docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

If your main Postgres container is already running, create test DB inside it:
```bash
sudo docker exec -it postgres psql -U postgres -d postgres -c "CREATE DATABASE unihorario_test;"
```
If it already exists, use:
```bash
docker exec -it postgres psql -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname='unihorario_test';"
```
also dont forget to set the env variables in the .env file, as well as the test db:
```bash
TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/unihorario_test ./.venv/bin/pytest -q src/tests/test_repositories_integration.py
```

## Features Covered

- **Job Manager**: Submission, status tracking, and result retrieval.
- **Asyncio Events**: Testing the `await_job` and `await_tree` functionality which relies on `asyncio.Event`.
- **FastAPI Endpoints**: `/helloworld`, `/api/catalog`, and the job awaiting endpoints.
