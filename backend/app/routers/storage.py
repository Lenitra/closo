from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.utils.auth.roles import get_current_user
from app.utils.core.database import get_db
from app.repositories.media_repository import MediaRepository
from app.entities.user import User
from app.utils.slave_manager.orchestrator import (
    list_all_files_from_slave,
    delete_file_from_slave,
)


router = APIRouter(prefix="/storage", tags=["Storage"])
media_repo = MediaRepository()


@router.get(
    "/files",
    description="Liste tous les fichiers du slave storage. Réservé aux administrateurs.",
)
def get_all_storage_files(
    current_user: User = Depends(get_current_user),
):
    """
    Récupère la liste de tous les fichiers stockés sur le slave storage.
    Réservé aux administrateurs (role_id == 3).
    """
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )
    try:
        result = list_all_files_from_slave()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch files from storage: {str(e)}"
        )


@router.get(
    "/files/{file_id}",
    description="Récupère les informations d'un fichier incluant le post_id associé. Réservé aux administrateurs.",
)
def get_storage_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Récupère les informations d'un fichier en cherchant dans la base de données.
    Retourne le post_id si le fichier est associé à un post.
    Réservé aux administrateurs (role_id == 3).
    """
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )
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
    description="Supprime un fichier du slave storage. Réservé aux administrateurs.",
)
def delete_storage_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Supprime un fichier du slave storage.
    Réservé aux administrateurs (role_id == 3).
    """
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )
    try:
        result = delete_file_from_slave(file_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete file from storage: {str(e)}"
        )
