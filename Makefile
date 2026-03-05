# Makefile (root)

.PHONY: help fe-install fe-dev fe-lint fe-build \
        be-install be-dev be-test be-migrate be-test-db-init \
        db-up db-down

help:
	@echo "Targets:"
	@echo "  make fe-install   # pnpm install (frontend)"
	@echo "  make fe-dev       # run Next.js dev server"
	@echo "  make fe-lint      # lint frontend"
	@echo "  make be-install   # uv sync (backend)"
	@echo "  make be-dev       # run FastAPI dev server"
	@echo "  make be-test      # run backend tests"
	@echo "  make be-test-db-init # ensure unihorario_test exists in Docker Postgres"
	@echo "  make be-migrate   # alembic upgrade head"
	@echo "  make db-up        # start postgres with docker compose"
	@echo "  make db-down      # stop postgres"

fe-install:
	cd frontend && pnpm install

fe-dev:
	cd frontend && pnpm dev

fe-lint:
	cd frontend && pnpm lint

fe-build:
	cd frontend && pnpm build

be-install:
	cd microservices/pdf-service && uv sync

be-dev:
	cd microservices/pdf-service && uv run uvicorn pdf_service.main:app --app-dir src --reload

be-test: be-test-db-init
	cd microservices/pdf-service && TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/unihorario_test uv run pytest

be-test-db-init:
	docker compose up -d db
	docker compose exec -T db sh -lc "psql -U postgres -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname='unihorario_test'\" | grep -q 1 || psql -U postgres -d postgres -c 'CREATE DATABASE unihorario_test'"
	docker compose exec -T db psql -U postgres -d unihorario_test -c "SELECT current_database();"

be-migrate:
	cd microservices/pdf-service && uv run alembic upgrade head

db-up:
	docker compose up -d db

db-down:
	docker compose down

bedb-up:
	docker compose up -d

bedb-down:
	docker compose down
