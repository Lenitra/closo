/**
 * Utilitaires de validation de fichiers côté client.
 * Valide la taille, le type MIME et l'extension des fichiers avant upload.
 */

// Taille maximale pour les images (8 MB en octets)
export const MAX_IMAGE_SIZE = 8 * 1024 * 1024 // 8 MB

// Types MIME autorisés pour les images
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

// Extensions autorisées
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

// Maximum de fichiers par upload de post
export const MAX_FILES_PER_POST = 10

export interface FileValidationError {
  file?: string
  message: string
}

/**
 * Valide qu'un fichier est une image valide.
 */
export function validateImageFile(file: File): FileValidationError | null {
  // 1. Vérifier l'extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return {
      file: file.name,
      message: `Extension non autorisée. Extensions acceptées: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
    }
  }

  // 2. Vérifier le type MIME
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      file: file.name,
      message: `Type de fichier non autorisé (${file.type}). Types acceptés: JPEG, PNG, GIF, WebP`,
    }
  }

  // 3. Vérifier la taille
  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    const maxSizeMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0)
    return {
      file: file.name,
      message: `${file.name} trop volumineux (${sizeMB} MB / ${maxSizeMB} MB max)`,
    }
  }

  // 4. Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    return {
      file: file.name,
      message: 'Le fichier est vide',
    }
  }

  return null
}

/**
 * Valide une liste de fichiers pour un post.
 */
export function validateMediaFiles(files: File[]): FileValidationError | null {
  // 1. Vérifier qu'il y a au moins un fichier
  if (files.length === 0) {
    return {
      message: 'Veuillez sélectionner au moins un fichier',
    }
  }

  // 2. Vérifier le nombre de fichiers
  if (files.length > MAX_FILES_PER_POST) {
    return {
      message: `Trop de fichiers sélectionnés (${files.length}). Maximum autorisé: ${MAX_FILES_PER_POST}`,
    }
  }

  // 3. Valider chaque fichier individuellement
  for (let i = 0; i < files.length; i++) {
    const error = validateImageFile(files[i])
    if (error) {
      const sizeMB = (files[i].size / (1024 * 1024)).toFixed(2)
      const maxSizeMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0)

      // Si c'est une erreur de taille, utiliser le format demandé
      if (files[i].size > MAX_IMAGE_SIZE) {
        return {
          message: `${files[i].name} (#${i + 1}) trop volumineux (${sizeMB} MB / ${maxSizeMB} MB max)`,
        }
      }

      return {
        ...error,
        message: `${files[i].name} (#${i + 1}) : ${error.message}`,
      }
    }
  }

  return null
}

/**
 * Formate un message d'erreur de validation pour l'affichage.
 */
export function formatValidationError(error: FileValidationError): string {
  return error.message
}
