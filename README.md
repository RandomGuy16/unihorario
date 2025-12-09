# Unihorario

Personal project to explore scheduling tools for university courses. The focus right now is a Next.js frontend and a PDF parsing microservice that can extract catalog data; the gateway/API layer will be added later.

## Project Layout
- `frontend/`: Next.js app router scaffold. UI work happens here (entry under `app/`).
- `microservices/pdf-service/`: FastAPI service to parse curriculum PDFs and surface catalog data. Helpers live in `src/`, fixtures in `pdf/` and `json/`.

## Getting Started
### Frontend (Next.js)
1) `cd frontend`
2) Install: `pnpm install`
3) Develop: `pnpm dev` (http://localhost:3000)
4) Lint: `pnpm lint`

### PDF Service (FastAPI)
1) `cd microservices/pdf-service`
2) Install deps: `uv sync` or `pip install -r requirements.txt`
3) Run dev server: `uvicorn main:app --reload` (default http://127.0.0.1:8000)
4) Try sample endpoints: `/helloworld`, `/api/catalog`, `/api/curriculum?school=<name>`

## Notes & Conventions
- Use `pnpm` for the frontend; Python 3.13+ for the service.
- Keep secrets in local `.env` files; do not commit `.env`, `.venv/`, or generated artifacts.
- TypeScript style: camelCase for values, PascalCase for components/classes, kebab-case filenames. Python: PEP 8 with 4-space indents.
- Tests: Jest planned for the frontend; none yet. For the PDF service, add unit tests around parsers and keep fixtures deterministic.

## Roadmap (short term)
- Replace the default Next.js landing page with schedule-focused screens.
- Solidify PDF parsing workflows and shape responses for the future API layer.
- Add component/feature tests and minimal e2e checks before wiring a gateway.
