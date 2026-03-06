# Unihorario

Unihorario helps university students build class schedules faster.

The web app exposes available courses and sections by career, cycle, and study plan. Students pick sections from a sidebar and place them into a weekly calendar grid based on real section shifts (faculty-defined times, not arbitrary custom time slots). The resulting schedule can be exported.

The platform also supports uploading an official assignment programming PDF (the academic-period document with courses/sections) so the backend can parse and register curriculum/catalog data.

## Monorepo Structure

- `frontend/`: Next.js app used by students to browse sections and build schedules.
- `gateway/`: NestJS API gateway (BFF/orchestration layer, currently minimal).
- `microservices/pdf-service/`: FastAPI microservice that parses uploaded curriculum PDFs and maintains catalog/curriculum data.

## Core Flow

1. User opens the web app and filters by career/cycle/study plan.
2. User drags/selects valid course sections into the calendar.
3. User exports the generated schedule.
4. User can upload an official assignment programming PDF to refresh or add curriculum data.

## Local Development

From repository root:

```bash
make db-up
make be-install
make be-dev
```

In another terminal:

```bash
make fe-install
make fe-dev
```

Frontend runs on `http://localhost:3000`.

## Testing

Backend tests (includes parser/API/integration coverage):

```bash
make be-test
```

Useful focused commands:

```bash
cd microservices/pdf-service && uv run pytest -q src/tests/test_e2e_api_db_flow.py -vv -s
cd microservices/pdf-service && uv run pytest -q src/tests/test_parsing_logic.py -vv
```

## Environment Notes

- Frontend uses `NEXT_PUBLIC_API_BASE_URL` to call backend APIs.
- PDF service uses `.env` values such as `DATABASE_URL`, `CORS_ORIGINS`, and paths for input/output dirs.
- Do not commit secrets or local environment files.

## Deployment

- Frontend is deployed on Vercel.
- Backend services are deployed separately (Docker/Gunicorn/Uvicorn setup in `microservices/pdf-service`).

## Documentation by Package

- Frontend guide: `frontend/README.md`
- Gateway guide: `gateway/README.md`
- PDF service guide: `microservices/pdf-service/README.md`
