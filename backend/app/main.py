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


# Initialize database on startup
def init_database():
    """Initialize database tables and seed data if database is empty."""
    try:
        # Create all tables if they don't exist
        SQLModel.metadata.create_all(engine)
        print("✅ Database tables created successfully")

        # Check if database needs seeding (check if role table is empty)
        with Session(engine) as session:
            try:
                result = session.exec(text("SELECT COUNT(*) FROM role")).first()
                if result[0] == 0:
                    print("📊 Database is empty, seeding initial data...")
                    seed_roles(session)
                    seed_users(session)
                    seed_groups(session)
                    print("✅ Database seeded successfully")
                else:
                    print("✅ Database already contains data, skipping seed")
            except Exception:
                # Rollback the failed transaction
                session.rollback()
                # Table doesn't exist or is empty, seed the data in a new session
                print("📊 Database tables created, seeding initial data...")

        # Use a fresh session for seeding if previous one failed
        with Session(engine) as session:
            try:
                # Check again if we need to seed
                result = session.exec(text("SELECT COUNT(*) FROM role")).first()
                if result[0] == 0:
                    seed_roles(session)
                    seed_users(session)
                    seed_groups(session)
                    print("✅ Database seeded successfully")
            except Exception:
                # First time seeding
                session.rollback()
                with Session(engine) as fresh_session:
                    seed_roles(fresh_session)
                    seed_users(fresh_session)
                    seed_groups(fresh_session)
                    print("✅ Database seeded successfully")
    except Exception as e:
        print(f"⚠️  Database initialization error: {e}")
        print("Attempting to continue anyway...")

# Initialize database
init_database()

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
