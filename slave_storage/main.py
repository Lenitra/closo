"""
Closo Slave Storage API
Service de stockage de fichiers distribué.
Seul le backend Closo peut accéder aux fichiers via une clé API secrète.
"""

import os
import uuid
import mimetypes
import aiofiles
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Header, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Initialiser les types MIME
mimetypes.init()

# Configuration
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "./storage"))
API_SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
NODE_ID = os.getenv("NODE_ID", "node-unamed")

# Créer le dossier de stockage
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Closo Slave Storage",
    description="Service de stockage de fichiers distribué",
    version="1.0.0",
)


# Modèles
class FileUploadResponse(BaseModel):
    id: str
    filename: str
    node_id: str
    size: int


class HealthResponse(BaseModel):
    status: str
    node_id: str
    storage_path: str
    nb_files: int
    total_size_bytes: int


# Authentification
async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    """Vérifie que la requête provient du backend Closo."""
    if x_api_key != API_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return x_api_key


# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Vérifie l'état du service."""
    return HealthResponse(
        status="healthy",
        node_id=NODE_ID,
        storage_path=str(STORAGE_DIR.absolute()),
        nb_files=len(list(STORAGE_DIR.iterdir())),
        total_size_bytes=sum(f.stat().st_size for f in STORAGE_DIR.iterdir() if f.is_file()),
    )


@app.post("/files", response_model=FileUploadResponse, dependencies=[Depends(verify_api_key)])
async def upload_file(file: UploadFile = File(...)):
    """
    Upload un fichier et lui attribue un ID unique.
    Requiert la clé API du backend Closo.
    """
    # Générer un ID unique
    file_id = str(uuid.uuid4())

    # Extraire l'extension du fichier original
    original_ext = Path(file.filename).suffix if file.filename else ""
    stored_filename = f"{file_id}{original_ext}"

    # Chemin de stockage
    file_path = STORAGE_DIR / stored_filename

    # Sauvegarder le fichier
    try:
        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)
            file_size = len(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    return FileUploadResponse(
        id=file_id,
        filename=stored_filename,
        node_id=NODE_ID,
        size=file_size,
    )


@app.get("/files/{file_id}", dependencies=[Depends(verify_api_key)])
async def get_file(file_id: str):
    """
    Récupère un fichier par son ID.
    Requiert la clé API du backend Closo.
    """
    # Chercher le fichier avec n'importe quelle extension
    matching_files = list(STORAGE_DIR.glob(f"{file_id}.*"))

    if not matching_files:
        # Essayer sans extension
        file_path = STORAGE_DIR / file_id
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        matching_files = [file_path]

    file_path = matching_files[0]

    # Déterminer le type MIME à partir de l'extension
    media_type, _ = mimetypes.guess_type(str(file_path))
    if not media_type:
        media_type = "application/octet-stream"

    return FileResponse(file_path, media_type=media_type)


@app.delete("/files/{file_id}", dependencies=[Depends(verify_api_key)])
async def delete_file(file_id: str):
    """
    Supprime un fichier par son ID.
    Requiert la clé API du backend Closo.
    """
    # Chercher le fichier
    matching_files = list(STORAGE_DIR.glob(f"{file_id}.*"))

    if not matching_files:
        file_path = STORAGE_DIR / file_id
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        matching_files = [file_path]

    # Supprimer le fichier
    try:
        matching_files[0].unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

    return {"message": "File deleted", "id": file_id}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8060")))
