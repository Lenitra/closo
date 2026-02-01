/**
 * Utilitaires de compression d'images cote client.
 * Compresse les images avant upload pour reduire la bande passante.
 */
import imageCompression from 'browser-image-compression'

// Configuration de compression
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // Taille maximale apres compression (1 MB)
  maxWidthOrHeight: 2048, // Dimension maximale
  useWebWorker: true, // Utiliser un Web Worker pour ne pas bloquer l'UI
  preserveExif: false, // Ne pas conserver les metadonnees EXIF (confidentialite)
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  savingsPercent: number
}

export interface CompressionProgress {
  file: string
  progress: number
}

/**
 * Compresse une image.
 */
export async function compressImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const originalSize = file.size

  // Les GIFs ne doivent pas etre compresses (perte d'animation)
  if (file.type === 'image/gif') {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savingsPercent: 0,
    }
  }

  try {
    const compressedBlob = await imageCompression(file, {
      ...COMPRESSION_OPTIONS,
      onProgress,
    })

    // Créer un nouveau File avec le nom original pour conserver l'extension
    const compressedFile = new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    })

    const compressedSize = compressedFile.size
    const savingsPercent = Math.round((1 - compressedSize / originalSize) * 100)

    // Si la compression a agrandi le fichier, garder l'original
    if (compressedSize >= originalSize) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        savingsPercent: 0,
      }
    }

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      savingsPercent: Math.max(0, savingsPercent),
    }
  } catch (error) {
    console.warn('Compression failed for', file.name, '- using original:', error)
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savingsPercent: 0,
    }
  }
}

/**
 * Compresse plusieurs images en sequence (une par une).
 */
export async function compressImages(
  files: File[],
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await compressImage(file, (progress) => {
      onProgress?.({
        file: file.name,
        progress,
      })
    })
    results.push(result)

    // Notifier la fin de la compression de ce fichier
    if (result) {
      onProgress?.({
        file: file.name,
        progress: 100,
      })
    }
  }

  return results
}

/**
 * Calcule les statistiques totales de compression.
 */
export function getCompressionStats(results: CompressionResult[]): {
  totalOriginalSize: number
  totalCompressedSize: number
  totalSavingsPercent: number
  totalSavingsBytes: number
} {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0)
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0)
  const totalSavingsBytes = totalOriginalSize - totalCompressedSize
  const totalSavingsPercent =
    totalOriginalSize > 0 ? Math.round((totalSavingsBytes / totalOriginalSize) * 100) : 0

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavingsPercent,
    totalSavingsBytes,
  }
}

/**
 * Formate une taille en bytes en format lisible.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
