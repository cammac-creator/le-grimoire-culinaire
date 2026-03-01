import type { ExtractedGlyph } from '@/types'

// ─── Types internes ─────────────────────────────────────

interface Component {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  area: number
}

export interface CroppedGlyph {
  character: string
  imageData: ImageData
  binarized: ImageData
  dataUrl: string
  confidence: number
}

export interface ProcessedImage {
  montageBase64: string
  componentImages: ImageData[]
  componentCount: number
}

// ─── Binarisation (seuil d'Otsu) ────────────────────────

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
  let best = 128

  for (let t = 0; t < 256; t++) {
    wB += histogram[t]
    if (wB === 0) continue
    const wF = totalPixels - wB
    if (wF === 0) break
    sumB += t * histogram[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const v = wB * wF * (mB - mF) * (mB - mF)
    if (v > maxVariance) {
      maxVariance = v
      best = t
    }
  }
  return best
}

export function binarize(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const threshold = otsuThreshold(data)

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const val = gray < threshold ? 0 : 255
    data[i] = val
    data[i + 1] = val
    data[i + 2] = val
  }
  return new ImageData(data, imageData.width, imageData.height)
}

// ─── Analyse de composantes connexes (flood fill BFS) ───

function findConnectedComponents(binarized: ImageData): Component[] {
  const { width, height, data } = binarized
  const visited = new Uint8Array(width * height)
  const components: Component[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx]) continue
      if (data[idx * 4] >= 128) continue // pixel blanc

      // BFS flood fill (8-connectivity)
      const queue: number[] = [idx]
      visited[idx] = 1
      let minX = x, maxX = x, minY = y, maxY = y
      let area = 0

      while (queue.length > 0) {
        const ci = queue.pop()!
        const cx = ci % width
        const cy = (ci - cx) / width
        area++

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = cx + dx, ny = cy + dy
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
            const ni = ny * width + nx
            if (visited[ni]) continue
            if (data[ni * 4] >= 128) continue
            visited[ni] = 1
            queue.push(ni)
            if (nx < minX) minX = nx
            if (nx > maxX) maxX = nx
            if (ny < minY) minY = ny
            if (ny > maxY) maxY = ny
          }
        }
      }

      components.push({
        minX, minY, maxX, maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        area,
      })
    }
  }
  return components
}

// ─── Filtrage des composantes ───────────────────────────

function filterComponents(components: Component[], imgWidth: number, imgHeight: number): Component[] {
  const minDim = Math.max(10, imgWidth * 0.005)
  const maxDim = Math.min(imgWidth * 0.12, imgHeight * 0.12)
  const minArea = 30

  return components.filter((c) => {
    if (c.area < minArea) return false
    if (c.width < minDim || c.height < minDim) return false
    if (c.width > maxDim || c.height > maxDim) return false
    const aspect = c.width / c.height
    if (aspect > 4 || aspect < 0.15) return false
    return true
  })
}

// ─── Tri en ordre de lecture ────────────────────────────

function sortReadingOrder(components: Component[]): Component[] {
  if (components.length === 0) return []

  // Trier par Y central
  const sorted = [...components].sort((a, b) => {
    const aCy = (a.minY + a.maxY) / 2
    const bCy = (b.minY + b.maxY) / 2
    return aCy - bCy
  })

  // Grouper en lignes
  const lines: Component[][] = []
  let currentLine: Component[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const prevCy = (currentLine[0].minY + currentLine[0].maxY) / 2
    const currCy = (sorted[i].minY + sorted[i].maxY) / 2
    const avgHeight = currentLine.reduce((s, c) => s + c.height, 0) / currentLine.length

    if (Math.abs(currCy - prevCy) < avgHeight * 0.6) {
      currentLine.push(sorted[i])
    } else {
      lines.push(currentLine)
      currentLine = [sorted[i]]
    }
  }
  lines.push(currentLine)

  // Dans chaque ligne, trier gauche→droite
  return lines.flatMap((line) => line.sort((a, b) => a.minX - b.minX))
}

// ─── Création du montage numéroté ───────────────────────

const CELL_SIZE = 100
const MONTAGE_COLS = 10
const MAX_COMPONENTS = 120

function createMontage(
  components: Component[],
  sourceCanvas: HTMLCanvasElement
): { dataUrl: string; componentImages: ImageData[] } {
  const limited = components.slice(0, MAX_COMPONENTS)
  const rows = Math.ceil(limited.length / MONTAGE_COLS)

  const canvas = document.createElement('canvas')
  canvas.width = MONTAGE_COLS * CELL_SIZE
  canvas.height = rows * CELL_SIZE
  const ctx = canvas.getContext('2d')!

  // Fond blanc
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const componentImages: ImageData[] = []

  limited.forEach((comp, i) => {
    const col = i % MONTAGE_COLS
    const row = Math.floor(i / MONTAGE_COLS)
    const cellX = col * CELL_SIZE
    const cellY = row * CELL_SIZE

    // Extraire l'image du composant
    const margin = 4
    const srcX = Math.max(0, comp.minX - margin)
    const srcY = Math.max(0, comp.minY - margin)
    const srcW = Math.min(comp.width + margin * 2, sourceCanvas.width - srcX)
    const srcH = Math.min(comp.height + margin * 2, sourceCanvas.height - srcY)

    // Sauvegarder l'image du composant
    const compCanvas = document.createElement('canvas')
    compCanvas.width = srcW
    compCanvas.height = srcH
    const compCtx = compCanvas.getContext('2d')!
    compCtx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
    componentImages.push(compCtx.getImageData(0, 0, srcW, srcH))

    // Dessiner dans la cellule (centré, mis à l'échelle)
    const pad = 16
    const availW = CELL_SIZE - pad * 2
    const availH = CELL_SIZE - pad - 4 // laisser place au numéro en haut
    const scale = Math.min(availW / srcW, availH / srcH, 2)
    const drawW = srcW * scale
    const drawH = srcH * scale
    const drawX = cellX + (CELL_SIZE - drawW) / 2
    const drawY = cellY + pad + (availH - drawH) / 2

    ctx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, drawX, drawY, drawW, drawH)

    // Numéro en haut à gauche
    ctx.fillStyle = '#e11d48'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText(`${i + 1}`, cellX + 3, cellY + 12)

    // Bordure de cellule
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 0.5
    ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE)
  })

  return { dataUrl: canvas.toDataURL('image/png'), componentImages }
}

// ─── Utilitaires ────────────────────────────────────────

export function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// ─── Pipeline principal ─────────────────────────────────

/**
 * Étape 1 : Traitement d'image côté client.
 * Binarise, trouve les composantes connexes, crée un montage numéroté.
 */
export async function processImageForExtraction(
  imageUrl: string,
  onProgress?: (msg: string) => void
): Promise<ProcessedImage> {
  onProgress?.('Chargement de l\'image...')
  const img = await loadImage(imageUrl)

  // Dessiner sur un canvas
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  onProgress?.('Binarisation...')
  const raw = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const bin = binarize(raw)

  // Écrire la version binarisée sur le canvas (pour le montage)
  const binCanvas = document.createElement('canvas')
  binCanvas.width = bin.width
  binCanvas.height = bin.height
  const binCtx = binCanvas.getContext('2d')!
  binCtx.putImageData(bin, 0, 0)

  onProgress?.('Détection des caractères...')
  await new Promise((r) => requestAnimationFrame(r))

  const components = findConnectedComponents(bin)
  onProgress?.(`${components.length} éléments détectés, filtrage...`)

  const filtered = filterComponents(components, bin.width, bin.height)
  const sorted = sortReadingOrder(filtered)
  onProgress?.(`${sorted.length} caractères potentiels`)

  // Utiliser le canvas original (pas binarisé) pour le montage — plus lisible pour Claude
  onProgress?.('Création du montage...')
  const originalCanvas = document.createElement('canvas')
  originalCanvas.width = img.naturalWidth
  originalCanvas.height = img.naturalHeight
  const origCtx = originalCanvas.getContext('2d')!
  origCtx.drawImage(img, 0, 0)

  const { dataUrl, componentImages } = createMontage(sorted, originalCanvas)

  // Extraire le base64 (enlever le préfixe data:image/png;base64,)
  const base64 = dataUrl.split(',')[1]

  return {
    montageBase64: base64,
    componentImages,
    componentCount: componentImages.length,
  }
}

/**
 * Étape 3 : Construire la Map<char, CroppedGlyph> à partir des labels Claude.
 */
export function buildGlyphMap(
  labels: Record<string, string>,
  componentImages: ImageData[]
): Map<string, CroppedGlyph> {
  const result = new Map<string, CroppedGlyph>()

  for (const [numStr, character] of Object.entries(labels)) {
    const idx = parseInt(numStr, 10) - 1 // Les numéros commencent à 1
    if (idx < 0 || idx >= componentImages.length) continue
    if (!character || character.length !== 1) continue

    // Ne garder que le premier (meilleur) pour chaque caractère
    if (result.has(character)) continue

    const imageData = componentImages[idx]
    const binData = binarize(imageData)

    result.set(character, {
      character,
      imageData,
      binarized: binData,
      dataUrl: imageDataToDataUrl(imageData),
      confidence: 0.9,
    })
  }

  return result
}

// ─── Ancien pipeline (gardé pour compatibilité) ─────────

/**
 * @deprecated Utiliser processImageForExtraction + buildGlyphMap à la place
 */
export async function extractAllCharacters(
  imageUrl: string,
  glyphs: ExtractedGlyph[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, CroppedGlyph>> {
  const img = await loadImage(imageUrl)
  const result = new Map<string, CroppedGlyph>()

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i]
    const existing = result.get(glyph.character)
    if (existing && existing.confidence >= glyph.confidence) {
      onProgress?.(i + 1, glyphs.length)
      continue
    }

    const x = Math.max(0, Math.round(glyph.bbox.x * img.naturalWidth) - 10)
    const y = Math.max(0, Math.round(glyph.bbox.y * img.naturalHeight) - 10)
    const w = Math.min(Math.round(glyph.bbox.width * img.naturalWidth) + 20, img.naturalWidth - x)
    const h = Math.min(Math.round(glyph.bbox.height * img.naturalHeight) + 20, img.naturalHeight - y)

    const raw = ctx.getImageData(x, y, Math.max(1, w), Math.max(1, h))
    const bin = binarize(raw)

    result.set(glyph.character, {
      character: glyph.character,
      imageData: raw,
      binarized: bin,
      dataUrl: imageDataToDataUrl(raw),
      confidence: glyph.confidence,
    })

    onProgress?.(i + 1, glyphs.length)
    if (i % 10 === 0) await new Promise((r) => requestAnimationFrame(r))
  }

  return result
}
