"""
Utilitaires de validation de fichiers uploadés.
Vérifie la taille, le type MIME réel (magic bytes), et les extensions autorisées.
"""
from fastapi import UploadFile, HTTPException
from typing import Optional

# Import optionnel de python-magic (fallback si non disponible)
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False


# Taille maximale pour les images (2 MB en octets)
MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2 MB

# Types MIME autorisés pour les images avec leurs magic bytes
ALLOWED_IMAGE_MIMES = {
    "image/jpeg": [b"\xFF\xD8\xFF"],  # JPEG
    "image/png": [b"\x89PNG\r\n\x1a\n"],  # PNG
    "image/gif": [b"GIF87a", b"GIF89a"],  # GIF
    "image/webp": [b"RIFF"],  # WebP (plus complexe, vérifié après)
}

# Extensions de fichiers autorisées
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def validate_image_file(
    file: UploadFile,
    max_size: int = MAX_IMAGE_SIZE,
    allowed_mimes: Optional[dict] = None,
) -> None:
    """
    Valide qu'un fichier uploadé est une image valide.

    Args:
        file: Le fichier uploadé par l'utilisateur
        max_size: Taille maximale en octets (défaut: 2 MB)
        allowed_mimes: Types MIME autorisés (défaut: ALLOWED_IMAGE_MIMES)

    Raises:
        HTTPException: Si le fichier est invalide (taille, type, extension)
    """
    if allowed_mimes is None:
        allowed_mimes = ALLOWED_IMAGE_MIMES

    # 1. Vérifier l'extension du fichier
    if file.filename:
        extension = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Extension de fichier non autorisée. Extensions autorisées: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
            )
    else:
        raise HTTPException(status_code=400, detail="Le nom de fichier est requis.")

    # 2. Lire le contenu du fichier
    file_content = file.file.read()
    file_size = len(file_content)

    # Réinitialiser le curseur du fichier pour qu'il puisse être lu à nouveau
    file.file.seek(0)

    # 3. Vérifier la taille du fichier
    if file_size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        actual_size_mb = file_size / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"Le fichier est trop volumineux ({actual_size_mb:.2f} MB). Taille maximale: {max_size_mb:.2f} MB",
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Le fichier est vide.")

    # 4. Vérifier le type MIME réel avec magic bytes
    detected_mime = detect_mime_type(file_content)

    if detected_mime not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non autorisé. Le fichier doit être une image ({', '.join(allowed_mimes.keys())})",
        )


def detect_mime_type(file_content: bytes) -> str:
    """
    Détecte le type MIME réel d'un fichier en lisant ses magic bytes.

    Args:
        file_content: Le contenu du fichier en bytes

    Returns:
        Le type MIME détecté (ex: "image/jpeg")
    """
    # Vérifier les magic bytes pour chaque type d'image
    if file_content.startswith(b"\xFF\xD8\xFF"):
        return "image/jpeg"
    elif file_content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    elif file_content.startswith(b"GIF87a") or file_content.startswith(b"GIF89a"):
        return "image/gif"
    elif file_content.startswith(b"RIFF") and b"WEBP" in file_content[:16]:
        return "image/webp"
    else:
        # Utiliser python-magic comme fallback si disponible
        if HAS_MAGIC:
            try:
                mime = magic.Magic(mime=True)
                detected = mime.from_buffer(file_content)
                return detected
            except Exception:
                pass
        return "application/octet-stream"


def validate_media_files(
    files: list[UploadFile],
    max_size_per_file: int = MAX_IMAGE_SIZE,
    max_files: int = 10,
) -> None:
    """
    Valide une liste de fichiers média pour les posts.

    Args:
        files: Liste des fichiers uploadés
        max_size_per_file: Taille maximale par fichier en octets
        max_files: Nombre maximal de fichiers autorisés

    Raises:
        HTTPException: Si les fichiers sont invalides
    """
    if not files:
        raise HTTPException(status_code=400, detail="Au moins un fichier est requis.")

    if len(files) > max_files:
        raise HTTPException(
            status_code=400,
            detail=f"Trop de fichiers. Maximum autorisé: {max_files}",
        )

    # Valider chaque fichier individuellement
    for idx, file in enumerate(files):
        try:
            validate_image_file(file, max_size=max_size_per_file)
        except HTTPException as e:
            # Ajouter le numéro du fichier dans le message d'erreur
            raise HTTPException(
                status_code=e.status_code,
                detail=f"Fichier #{idx + 1}: {e.detail}",
            )
