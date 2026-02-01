"""
Utilitaires de compression d'images.
Compresse les images avant stockage pour optimiser l'espace et les performances.
"""
from PIL import Image
from fastapi import UploadFile
import io
from typing import BinaryIO


# Configuration de compression
MAX_DIMENSION = 2048  # Dimension maximale (largeur ou hauteur)
JPEG_QUALITY = 85  # Qualité JPEG (0-100)
WEBP_QUALITY = 85  # Qualité WebP (0-100)


def compress_image(
    file_content: bytes,
    max_dimension: int = MAX_DIMENSION,
    quality: int = JPEG_QUALITY,
    output_format: str = "JPEG",
) -> tuple[bytes, str]:
    """
    Compresse une image et la redimensionne si necessaire.

    Args:
        file_content: Contenu brut de l'image
        max_dimension: Dimension maximale (largeur ou hauteur)
        quality: Qualite de compression (0-100)
        output_format: Format de sortie (JPEG, WEBP, PNG)

    Returns:
        Tuple (contenu compresse, extension du fichier)
    """
    img = Image.open(io.BytesIO(file_content))

    # Conserver l'orientation EXIF si presente
    try:
        from PIL import ExifTags
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break

        exif = img._getexif()
        if exif is not None:
            orientation_value = exif.get(orientation)
            if orientation_value == 3:
                img = img.rotate(180, expand=True)
            elif orientation_value == 6:
                img = img.rotate(270, expand=True)
            elif orientation_value == 8:
                img = img.rotate(90, expand=True)
    except (AttributeError, KeyError, IndexError):
        pass

    # Convertir RGBA/LA/P en RGB pour JPEG
    if output_format == "JPEG" and img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'RGBA':
            background.paste(img, mask=img.split()[3])
        elif img.mode == 'P' and 'transparency' in img.info:
            img = img.convert('RGBA')
            background.paste(img, mask=img.split()[3])
        else:
            background.paste(img)
        img = background

    # Redimensionner si l'image depasse la dimension maximale
    if max(img.size) > max_dimension:
        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

    # Compresser
    output = io.BytesIO()

    if output_format == "JPEG":
        img.save(output, format='JPEG', quality=quality, optimize=True)
        extension = ".jpg"
    elif output_format == "WEBP":
        img.save(output, format='WEBP', quality=quality)
        extension = ".webp"
    elif output_format == "PNG":
        img.save(output, format='PNG', optimize=True)
        extension = ".png"
    else:
        img.save(output, format='JPEG', quality=quality, optimize=True)
        extension = ".jpg"

    return output.getvalue(), extension


def compress_upload_file(
    file: UploadFile,
    max_dimension: int = MAX_DIMENSION,
    quality: int = JPEG_QUALITY,
) -> BinaryIO:
    """
    Compresse un fichier UploadFile et retourne un file-like object.

    Args:
        file: Fichier uploade par l'utilisateur
        max_dimension: Dimension maximale
        quality: Qualite de compression

    Returns:
        File-like object contenant l'image compressee
    """
    # Lire le contenu du fichier
    file_content = file.file.read()
    file.file.seek(0)  # Reset pour d'eventuelles autres lectures

    # Determiner le format de sortie selon le type original
    filename = file.filename or ""
    extension = filename.lower().split(".")[-1] if "." in filename else ""

    # Les GIF animes ne doivent pas etre compressee (perte d'animation)
    if extension == "gif":
        return io.BytesIO(file_content)

    # Utiliser WEBP pour les images WEBP, JPEG pour le reste
    if extension == "webp":
        output_format = "WEBP"
    elif extension == "png":
        # PNG avec transparence -> garder PNG, sinon convertir en JPEG
        try:
            img = Image.open(io.BytesIO(file_content))
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                output_format = "PNG"
            else:
                output_format = "JPEG"
        except Exception:
            output_format = "JPEG"
    else:
        output_format = "JPEG"

    # Compresser l'image
    compressed_content, _ = compress_image(
        file_content,
        max_dimension=max_dimension,
        quality=quality,
        output_format=output_format,
    )

    return io.BytesIO(compressed_content)


def get_compression_stats(original_size: int, compressed_size: int) -> dict:
    """
    Calcule les statistiques de compression.

    Returns:
        Dict avec les stats (taille originale, compressee, ratio, economie)
    """
    if original_size == 0:
        return {
            "original_size": 0,
            "compressed_size": 0,
            "ratio": 0,
            "savings_percent": 0,
        }

    ratio = compressed_size / original_size
    savings = (1 - ratio) * 100

    return {
        "original_size": original_size,
        "compressed_size": compressed_size,
        "ratio": round(ratio, 2),
        "savings_percent": round(savings, 1),
    }
