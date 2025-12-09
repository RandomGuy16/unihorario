from pathlib import Path
import dotenv


SRC_DIR = Path(__file__).parent
DOTENV_PATH = SRC_DIR / ".env"

dotenv.load_dotenv(dotenv_path=DOTENV_PATH, verbose=True)
JSON_DIR = Path.joinpath(SRC_DIR, dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="JSON_DIR"))
PDF_DIR = Path.joinpath(SRC_DIR, dotenv.get_key(dotenv_path=DOTENV_PATH, key_to_get="PDF_DIR"))

