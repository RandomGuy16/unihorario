from pathlib import Path
from pdf_service.core.logger import logger
import dotenv

PACKAGE_DIR = Path(__file__).resolve().parents[1]

def find_project_root(start: Path) -> Path:
    """Walk up until we find pyproject.toml"""
    for p in (start, *start.parents):
        if (p / "pyproject.toml").exists():
            return p

    return start

PROJECT_ROOT = find_project_root(PACKAGE_DIR)

SRC_DIR = Path(__file__).parent
DOTENV_PATH = PROJECT_ROOT / ".env"

logger.debug(f"Loading environment variables from {DOTENV_PATH}")
logger.debug(f"Package directory (SRC_DIR): {SRC_DIR}")
logger.debug(f"Project root: {PROJECT_ROOT}")

dotenv.load_dotenv(dotenv_path=DOTENV_PATH, verbose=True)
CAREERS_DIR_PATH = Path.joinpath(PROJECT_ROOT, dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="CAREERS_DIR"))
CATALOG_DIR_PATH = Path.joinpath(PROJECT_ROOT, dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="CATALOG_DIR"))
PDF_DIR_PATH     = Path.joinpath(PROJECT_ROOT, dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="PDF_DIR"))

