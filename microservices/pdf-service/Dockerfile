

FROM python:3.13.11-slim
# Traemos el binario de 'uv' desde su imagen oficial
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Instalamos dependencias del sistema (necesarias para Postgres/PDFs)
# para 'psycopg2' necesitas libpq-dev y gcc. Si usas 'asyncpg', podrías omitir gcc.
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-cache

ENV PATH="/app/.venv/bin:$PATH"

COPY . .

CMD ["sh", "-c", "uvicorn pdf_service.main:app --app-dir src --host 0.0.0.0 --port ${PORT:-8080}"]
