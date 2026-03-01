import type { CharacterBoundingBox, ExtractedGlyph } from '@/types'

// Padding relatif : 30% de la taille du caractère (minimum 10px)
const PADDING_RATIO = 0.3
const MIN_PADDING = 10

/**
 * Découpe un caractère dans une image à partir de sa bounding box normalisée (0-1).
 * Applique un padding proportionnel à la taille du caractère.
 */
export function cropCharacter(
  image: HTMLImageElement,
  bbox: CharacterBoundingBox
): ImageData {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const rawW = Math.round(bbox.width * image.naturalWidth)
  const rawH = Math.round(bbox.height * image.naturalHeight)

  const padX = Math.max(MIN_PADDING, Math.round(rawW * PADDING_RATIO))
  const padY = Math.max(MIN_PADDING, Math.round(rawH * PADDING_RATIO))

  const x = Math.max(0, Math.round(bbox.x * image.naturalWidth) - padX)
  const y = Math.max(0, Math.round(bbox.y * image.naturalHeight) - padY)
  const w = Math.min(rawW + padX * 2, image.naturalWidth - x)
  const h = Math.min(rawH + padY * 2, image.naturalHeight - y)

  canvas.width = w
  canvas.height = h

  ctx.drawImage(image, x, y, w, h, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

/**
 * Binarise une image (seuillage noir/blanc) pour préparer la vectorisation.
 * Utilise le seuil d'Otsu pour un résultat adaptatif.
 */
export function binarize(imageData: ImageData, threshold?: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data)

  // Calculer le seuil optimal (Otsu) si non fourni
  if (threshold === undefined) {
    threshold = otsuThreshold(data)
  }

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const val = gray < threshold ? 0 : 255
    data[i] = val
    data[i + 1] = val
    data[i + 2] = val
  }

  return new ImageData(data, imageData.width, imageData.height)
}

/**
 * Seuil d'Otsu : trouve automatiquement le meilleur seuil noir/blanc.
 */
function otsuThreshold(data: Uint8ClampedArray): number {
  const histogram = new Array(256).fill(0)
  const totalPixels = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
    histogram[gray]++
  }

  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]

  let sumB = 0
  let wB = 0
  let maxVariance = 0
  let bestThreshold = 128

  for (let t = 0; t < 256; t++) {
    wB += histogram[t]
    if (wB === 0) continue
    const wF = totalPixels - wB
    if (wF === 0) break

    sumB += t * histogram[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const variance = wB * wF * (mB - mF) * (mB - mF)

    if (variance > maxVariance) {
      maxVariance = variance
      bestThreshold = t
    }
  }

  return bestThreshold
}

/**
 * Auto-crop : détecte les pixels d'encre (noirs) et recadre au plus serré.
 * Conserve une petite marge de 4px.
 */
function autoCrop(imageData: ImageData): ImageData {
  const { width, height, data } = imageData
  const margin = 4

  let minX = width, minY = height, maxX = 0, maxY = 0
  let hasInk = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      // Pixel sombre = encre (valeur < 128)
      if (data[idx] < 128) {
        hasInk = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // Si pas d'encre détectée, retourner l'image telle quelle
  if (!hasInk) return imageData

  // Ajouter la marge
  const cropX = Math.max(0, minX - margin)
  const cropY = Math.max(0, minY - margin)
  const cropW = Math.min(width - cropX, maxX - minX + 1 + margin * 2)
  const cropH = Math.min(height - cropY, maxY - minY + 1 + margin * 2)

  // Extraire la sous-image
  const canvas = document.createElement('canvas')
  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d')!

  // Créer un canvas temporaire avec l'image source
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = width
  srcCanvas.height = height
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.putImageData(imageData, 0, 0)

  ctx.drawImage(srcCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
  return ctx.getImageData(0, 0, cropW, cropH)
}

/**
 * Convertit un ImageData en data URL pour affichage.
 */
export function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Charge une image depuis une URL et retourne un HTMLImageElement.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export interface CroppedGlyph {
  character: string
  imageData: ImageData
  binarized: ImageData
  dataUrl: string
  confidence: number
}

/**
 * Pipeline complet : image URL → extraction des caractères → Map<char, CroppedGlyph>.
 * On garde la meilleure instance de chaque caractère (plus haute confiance).
 */
export async function extractAllCharacters(
  imageUrl: string,
  glyphs: ExtractedGlyph[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, CroppedGlyph>> {
  const img = await loadImage(imageUrl)
  const result = new Map<string, CroppedGlyph>()

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i]

    // Ne garder que la meilleure instance par caractère
    const existing = result.get(glyph.character)
    if (existing && existing.confidence >= glyph.confidence) {
      onProgress?.(i + 1, glyphs.length)
      continue
    }

    const raw = cropCharacter(img, glyph.bbox)
    const bin = binarize(raw)
    const cropped = autoCrop(bin)
    const displayUrl = imageDataToDataUrl(raw)

    result.set(glyph.character, {
      character: glyph.character,
      imageData: raw,
      binarized: cropped, // version auto-croppée pour la vectorisation
      dataUrl: displayUrl,
      confidence: glyph.confidence,
    })

    onProgress?.(i + 1, glyphs.length)

    // Céder le thread toutes les 10 itérations
    if (i % 10 === 0) {
      await new Promise((r) => requestAnimationFrame(r))
    }
  }

  return result
}
