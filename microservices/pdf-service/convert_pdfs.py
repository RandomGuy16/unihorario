from src.data_transform import main
from src.services import CatalogService
from config import CATALOG_DIR_PATH
from pathlib import Path
import os
import json

main()

def write_catalog():
    catalog_service = CatalogService()

    if not os.path.exists(CATALOG_DIR_PATH):
        os.makedirs(CATALOG_DIR_PATH)
    with open(Path(CATALOG_DIR_PATH, 'catalog.json'), 'w') as catalog_file:
        json.dump(catalog_service.get_catalog(), catalog_file, indent=4, ensure_ascii=False)

# asyncio.run(write_catalog())
write_catalog()
