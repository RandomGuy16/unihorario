from pathlib import Path
import os
from pdf_service.core.logger import logger
import dotenv

PACKAGE_DIR = Path(__file__).resolve().parents[1]

def find_project_root(start: Path) -> Path:
    """Walk up until we find pyproject.toml"""
    for p in (start, *start.parents):
        if (p / "pyproject.toml").exists() or (p / "requirements.txt").exists():
            return p

    return start

PROJECT_ROOT = find_project_root(PACKAGE_DIR)

# SRC_DIR = Path(__file__).parent
SRC_DIR = PROJECT_ROOT / "src"
DOTENV_PATH = PROJECT_ROOT / ".env"

logger.debug(f"Loading environment variables from {DOTENV_PATH}")
logger.debug(f"Package directory (SRC_DIR): {SRC_DIR}")
logger.debug(f"Project root: {PROJECT_ROOT}")

dotenv.load_dotenv(dotenv_path=DOTENV_PATH, verbose=True, override=False)

CAREERS_DIR = os.getenv("CAREERS_DIR") or dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="CAREERS_DIR") or "out/careers"
CATALOG_DIR = os.getenv("CATALOG_DIR") or dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="CATALOG_DIR") or "out/catalog"
PDF_DIR = os.getenv("PDF_DIR") or dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="PDF_DIR") or "pdf"
TESTS_DIR = os.getenv("TESTS_DIR") or dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="TESTS_DIR") or "tests"
DATABASE_URL = os.getenv("DATABASE_URL") or dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
#
# if DATABASE_URL.startswith("postgresql://"):
#     DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

CAREERS_DIR_PATH = Path.joinpath(PROJECT_ROOT, CAREERS_DIR)
CATALOG_DIR_PATH = Path.joinpath(PROJECT_ROOT, CATALOG_DIR)
PDF_DIR_PATH = Path.joinpath(PROJECT_ROOT, PDF_DIR)
TESTS_DIR_PATH = Path.joinpath(SRC_DIR, TESTS_DIR)
PORT = int(os.getenv("PORT", 8080))

CORS_ORIGINS = [
    origin.strip() for origin in (os.getenv("CORS_ORIGINS", "")).split(",") if origin.strip()
]
