from pathlib import Path
import dotenv


SRC_DIR = Path(__file__).parent
DOTENV_PATH = SRC_DIR / ".env"

dotenv.load_dotenv(dotenv_path=DOTENV_PATH, verbose=True)
CAREERS_DIR_PATH = Path.joinpath(SRC_DIR, dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="CAREERS_DIR"))
CATALOG_DIR_PATH = Path.joinpath(SRC_DIR, dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="CATALOG_DIR"))
PDF_DIR_PATH = Path.joinpath(SRC_DIR, dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="PDF_DIR"))

