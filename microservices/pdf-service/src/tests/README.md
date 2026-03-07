# PDF Service Test Guide

This folder contains parser, repository, API, and e2e tests for `pdf-service`.

## Test Files

- `test_parsing_logic.py`: parser-level behavior using real PDF fixtures.
- `test_repositories_integration.py`: DB repository behavior and persistence rules.
- `test_job_manager.py`: background job manager behavior and chaining.
- `test_api.py`: endpoint-level contract checks.
- `test_smoke_api_db_flow.py`: quick end-to-end sanity checks.
- `test_e2e_api_db_flow.py`: deeper async flow coverage (upload -> jobs -> catalog/curriculum).
- `test_mappers.py`: domain/ORM mapping correctness.

## Fixtures

- `fixtures/ingenieria_sistemas.pdf`
- `fixtures/ingenieria_electronica.pdf`

Use these to validate parser behavior and regressions.

## Run Commands

Run all tests:

```bash
cd microservices/pdf-service
uv run pytest
```

Run a specific suite:

```bash
cd microservices/pdf-service
uv run pytest -q src/tests/test_parsing_logic.py -vv
uv run pytest -q src/tests/test_e2e_api_db_flow.py -vv -s
```

Run one test case:

```bash
cd microservices/pdf-service
uv run pytest -q src/tests/test_e2e_api_db_flow.py::test_e2e_send_multiple_careers_curriculums_and_refresh_catalog -vv -s
```

## Local DB Requirements

- Docker Postgres must be running.
- `unihorario_test` database must exist.
- `TEST_DATABASE_URL` should point to that database.

From repo root:

```bash
make be-test-db-init
```

## Writing New Tests

- Prefer deterministic assertions with explicit expected values.
- Use fixtures from `fixtures/` instead of ad-hoc generated files.
- Keep each test focused on one behavior/regression.
- For bug fixes, add a regression test first when possible.
