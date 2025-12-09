# Repository Guidelines

## Project Structure & Module Organization
- Monorepo with three packages: `frontend/` (Next.js app router; entry in `app/`), `gateway/` (NestJS API; code in `src/`, tests in `test/`), `microservices/pdf-service/` (FastAPI service; logic in `src/`, sample inputs in `pdf/` and `json/`).
- Config stays per package (`tsconfig*.json`, `eslint.config.mjs`, `pyproject.toml`). Keep secrets in local env files; do not commit `.env`, `.venv/`, or build outputs.

## Build, Test, and Development Commands
- Frontend: inside `frontend/` run `pnpm dev` (watch), `pnpm build`, `pnpm start`, `pnpm lint`.
- Gateway: inside `gateway/` run `pnpm start:dev`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, `pnpm test:cov`, `pnpm lint`, `pnpm format`.
- PDF service: in `microservices/pdf-service/` use `uv sync` or `pip install -r requirements.txt`, then `uvicorn main:app --reload` for local API.

## Coding Style & Naming Conventions
- TypeScript: `camelCase` for values/functions, `PascalCase` for React components and Nest classes/providers, `kebab-case` files. Keep frontend components near usage in `app/` folders.
- Lint/format: Next + ESLint in frontend; ESLint + Prettier in gateway—fix warnings before pushing. Python code follows PEP 8 with 4-space indents.

## Testing Guidelines
- Gateway: Jest `.spec.ts` files in `src/` or `test/`; target coverage when adding endpoints; prefer deterministic fixtures.
- Frontend: test harness not yet configured; at minimum run `pnpm lint` and note manual checks for UI changes until component tests are added.
- PDF service: add unit tests for parsers/services before expanding routes; reuse fixtures in `pdf/` and `json/`.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commit prefixes (e.g., `feat(frontend): add schedule view`, `fix(gateway): validate inputs`). One logical change per commit.
- PRs should summarize scope, list affected packages, include test/lint results, and add screenshots or sample responses for UI or API changes.
- Keep branches small and up to date with main; never commit secrets or editor/workspace files.

## Security & Configuration Tips
- Review CORS settings in `microservices/pdf-service/main.py` and align origins per environment.
- Store service URLs/keys in env files; rotate credentials and avoid checking them into git.
