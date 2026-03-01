import type { CharacterBoundingBox, ExtractedGlyph } from '@/types'

const PADDING = 4

/**
 * Découpe un caractère dans une image à partir de sa bounding box normalisée (0-1).
 */
export function cropCharacter(
  image: HTMLImageElement,
  bbox: CharacterBoundingBox
): ImageData {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const x = Math.max(0, Math.round(bbox.x * image.naturalWidth) - PADDING)
  const y = Math.max(0, Math.round(bbox.y * image.naturalHeight) - PADDING)
  const w = Math.min(
    Math.round(bbox.width * image.naturalWidth) + PADDING * 2,
    image.naturalWidth - x
  )
  const h = Math.min(
    Math.round(bbox.height * image.naturalHeight) + PADDING * 2,
    image.naturalHeight - y
  )

  canvas.width = w
  canvas.height = h

  ctx.drawImage(image, x, y, w, h, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

/**
 * Binarise une image (seuillage noir/blanc) pour préparer la vectorisation.
 */
export function binarize(imageData: ImageData, threshold = 128): ImageData {
  const data = new Uint8ClampedArray(imageData.data)

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const val = gray < threshold ? 0 : 255
    data[i] = val
    data[i + 1] = val
    data[i + 2] = val
    // Alpha reste à 255
  }

  return new ImageData(data, imageData.width, imageData.height)
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
    const url = imageDataToDataUrl(raw)

    result.set(glyph.character, {
      character: glyph.character,
      imageData: raw,
      binarized: bin,
      dataUrl: url,
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
