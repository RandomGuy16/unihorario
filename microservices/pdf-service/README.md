# Unihorario PDF Service

FastAPI microservice that parses official assignment-programming PDFs and stores curriculum/catalog data for the Unihorario platform.

## Responsibilities

- Accept PDF uploads for a university career and academic period.
- Parse metadata, cycles, course sections, and schedules.
- Persist parsed curriculum data in PostgreSQL.
- Build and expose catalog data used by the frontend filters.
- Execute parsing/refresh operations as background jobs with await endpoints.

## Main Endpoints

- `GET /helloworld`
- `GET /api/catalog`
- `GET /api/curriculum?school=<school-name>`
- `POST /api/curriculum` (multipart with `file`)
- `GET /api/jobs/await_job/{job_id}`
- `GET /api/jobs/await_tree/{job_id}`

## Local Run

From repository root:

```bash
make db-up
```

From this folder:

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn pdf_service.main:app --app-dir src --reload --port 8080
```

## Testing

```bash
uv run pytest
```

Focused suites:

```bash
uv run pytest -q src/tests/test_parsing_logic.py -vv
uv run pytest -q src/tests/test_e2e_api_db_flow.py -vv -s
```

## Environment

Important variables:

- `DATABASE_URL`
- `CORS_ORIGINS`
- `PORT`
- `CAREERS_DIR`, `CATALOG_DIR`, `PDF_DIR`

## Notes for Contributors

- Use Sphinx-style docstrings (`:param`, `:type`, `:return`, `:rtype`, `:ivar`).
- Parser behavior should be validated against fixtures under `src/tests/fixtures`.
- Keep tests deterministic and include regression coverage for parser edge cases.
