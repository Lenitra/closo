from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.utils.auth.roles import require_role
from app.utils.core.database import get_db
from app.repositories.media_repository import MediaRepository
from app.utils.slave_manager.orchestrator import (
    list_all_files_from_slave,
    delete_file_from_slave,
)


router = APIRouter(prefix="/storage", tags=["Storage"])
media_repo = MediaRepository()


@router.get(
    "/files",
    description="Liste tous les fichiers du slave storage (admin seulement).",
)
def get_all_storage_files(
    _=Depends(require_role(["any"])),  # TODO: Restreindre aux admins
):
    """
    Récupère la liste de tous les fichiers stockés sur le slave storage.
    """
    try:
        result = list_all_files_from_slave()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch files from storage: {str(e)}"
        )


@router.get(
    "/files/{file_id}",
    description="Récupère les informations d'un fichier incluant le post_id associé.",
)
def get_storage_file(
    file_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_role(["any"])),  # TODO: Restreindre aux admins
):
    """
    Récupère les informations d'un fichier en cherchant dans la base de données.
    Retourne le post_id si le fichier est associé à un post.
    """
    try:
        # Extraire l'ID du fichier depuis l'URL (format: /media/proxy/{file_id})
        # Chercher dans la base de données les médias qui matchent
        medias = media_repo.list(db)

        for media in medias:
            # media.media_url est de la forme /media/proxy/{file_id}
            if file_id in media.media_url:
                return {
                    "id": file_id,
                    "media_url": media.media_url,
                    "post_id": media.post_id,
                    "order": media.order,
                }

        # Si pas trouvé dans la DB, retourner juste l'ID (fichier orphelin)
        return {
            "id": file_id,
            "media_url": f"/media/proxy/{file_id}",
            "post_id": None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch file info: {str(e)}"
        )


@router.delete(
    "/files/{file_id}",
    description="Supprime un fichier du slave storage (admin seulement).",
)
def delete_storage_file(
    file_id: str,
    _=Depends(require_role(["any"])),  # TODO: Restreindre aux admins
):
    """
    Supprime un fichier du slave storage.
    """
    try:
        result = delete_file_from_slave(file_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete file from storage: {str(e)}"
        )
