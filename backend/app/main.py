from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from sqlalchemy import text
from app.utils.core.config import settings
from app.utils.core.database import engine
from sqlmodel import Session
from app.utils.seed import seed_roles, seed_users, seed_groups

import pkgutil
import importlib
import pathlib

#
# Importer automatiquement les entités pour s'assurer qu'elles sont enregistrées
#

entities_dir = pathlib.Path(__file__).parent / "entities"

for module_info in pkgutil.iter_modules([str(entities_dir)]):
    name = module_info.name
    if name.startswith("_"):
        continue

    try:
        importlib.import_module(f"app.entities.{name}")
    except ImportError as e:
        print(f"❌ Warning: Could not import entity {name}: {e}")


# Create database tables (drop and recreate to ensure schema is up to date)
# Use CASCADE to handle foreign key constraints
# with engine.connect() as conn:
#     for table in reversed(SQLModel.metadata.sorted_tables):
#         conn.execute(text(f'DROP TABLE IF EXISTS "{table.name}" CASCADE'))
#     conn.commit()
# SQLModel.metadata.create_all(engine)

# # # Seed initial data
# with Session(engine) as session:
#     seed_roles(session)
#     seed_users(session)
#     seed_groups(session)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Closo API Backend",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: Authentication middleware removed to preserve Swagger documentation
# Routes are protected individually using Depends(get_current_user)

# Auto-discover all routers
routers_dir = pathlib.Path(__file__).parent / "routers"


for module_info in pkgutil.iter_modules([str(routers_dir)]):
    name = module_info.name
    if name.startswith("_"):
        continue

    try:
        module = importlib.import_module(f"app.routers.{name}")
        router = getattr(module, "router", None)
        if router:
            app.include_router(router)
    except ImportError as e:
        print(f"❌ Warning: Could not import router {name}: {e}")


@app.get("/health")
def health_check():
    return {"status": "healthy"}
