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

/** Résultat de l'extraction guidée par transcription */
export interface GuidedExtractionResult {
  /** Glyphes extraits (caractère → image) */
  glyphs: Map<string, CroppedGlyph>
  /** Lignes transcrites par Claude */
  transcribedLines: string[]
  /** Nombre total de caractères trouvés */
  totalMatched: number
  /** Image base64 pour la transcription */
  imageBase64: string
}

// ─── Amélioration du contraste (CLAHE simplifié) ────────

function enhanceContrast(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const { width, height } = imageData

  // Convertir en niveaux de gris et trouver min/max
  const gray = new Uint8Array(width * height)
  let gMin = 255, gMax = 0

  for (let i = 0; i < width * height; i++) {
    const g = Math.round(
      data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114
    )
    gray[i] = g
    if (g < gMin) gMin = g
    if (g > gMax) gMax = g
  }

  // Étirement d'histogramme avec clipping des extrêmes (2%)
  const histogram = new Uint32Array(256)
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++

  const totalPixels = gray.length
  const clipLow = totalPixels * 0.02
  const clipHigh = totalPixels * 0.98

  let cumSum = 0
  let newMin = 0
  for (let i = 0; i < 256; i++) {
    cumSum += histogram[i]
    if (cumSum >= clipLow) { newMin = i; break }
  }

  cumSum = 0
  let newMax = 255
  for (let i = 255; i >= 0; i--) {
    cumSum += histogram[i]
    if (cumSum >= totalPixels - clipHigh) { newMax = i; break }
  }

  const range = Math.max(1, newMax - newMin)

  for (let i = 0; i < width * height; i++) {
    const val = Math.round(((Math.max(newMin, Math.min(newMax, gray[i])) - newMin) / range) * 255)
    data[i * 4] = val
    data[i * 4 + 1] = val
    data[i * 4 + 2] = val
  }

  return new ImageData(data, width, height)
}

// ─── Seuillage adaptatif de Sauvola ─────────────────────

function sauvolaBinarize(imageData: ImageData, windowSize = 25, k = 0.2): ImageData {
  const { width, height, data: src } = imageData
  const out = new Uint8ClampedArray(src.length)

  // Convertir en gris
  const gray = new Float64Array(width * height)
  for (let i = 0; i < width * height; i++) {
    gray[i] = src[i * 4] * 0.299 + src[i * 4 + 1] * 0.587 + src[i * 4 + 2] * 0.114
  }

  // Images intégrales (somme et somme des carrés) pour calcul rapide de moyenne/écart-type local
  const integral = new Float64Array((width + 1) * (height + 1))
  const integralSq = new Float64Array((width + 1) * (height + 1))
  const iw = width + 1

  for (let y = 1; y <= height; y++) {
    for (let x = 1; x <= width; x++) {
      const v = gray[(y - 1) * width + (x - 1)]
      integral[y * iw + x] = v + integral[(y - 1) * iw + x] + integral[y * iw + (x - 1)] - integral[(y - 1) * iw + (x - 1)]
      integralSq[y * iw + x] = v * v + integralSq[(y - 1) * iw + x] + integralSq[y * iw + (x - 1)] - integralSq[(y - 1) * iw + (x - 1)]
    }
  }

  const half = Math.floor(windowSize / 2)
  const R = 128 // Plage dynamique pour Sauvola

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - half)
      const y1 = Math.max(0, y - half)
      const x2 = Math.min(width - 1, x + half)
      const y2 = Math.min(height - 1, y + half)

      const count = (x2 - x1 + 1) * (y2 - y1 + 1)
      const sum = integral[(y2 + 1) * iw + (x2 + 1)] - integral[y1 * iw + (x2 + 1)] - integral[(y2 + 1) * iw + x1] + integral[y1 * iw + x1]
      const sumSq = integralSq[(y2 + 1) * iw + (x2 + 1)] - integralSq[y1 * iw + (x2 + 1)] - integralSq[(y2 + 1) * iw + x1] + integralSq[y1 * iw + x1]

      const mean = sum / count
      const variance = Math.max(0, sumSq / count - mean * mean)
      const stddev = Math.sqrt(variance)

      // Formule de Sauvola : T(x,y) = mean * (1 + k * (stddev/R - 1))
      const threshold = mean * (1 + k * (stddev / R - 1))

      const idx = y * width + x
      const val = gray[idx] < threshold ? 0 : 255
      out[idx * 4] = val
      out[idx * 4 + 1] = val
      out[idx * 4 + 2] = val
      out[idx * 4 + 3] = 255
    }
  }

  return new ImageData(out, width, height)
}

// ─── Binarisation Otsu (gardée pour les crops individuels) ──

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

// ─── Opérations morphologiques ──────────────────────────

function erode(binarized: ImageData, radius = 1): ImageData {
  const { width, height, data: src } = binarized
  const out = new Uint8ClampedArray(src.length)
  out.fill(255) // fond blanc par défaut

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let allBlack = true
      outer:
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            allBlack = false; break outer
          }
          if (src[(ny * width + nx) * 4] >= 128) {
            allBlack = false; break outer
          }
        }
      }
      const idx = (y * width + x) * 4
      if (allBlack) {
        out[idx] = 0; out[idx + 1] = 0; out[idx + 2] = 0
      }
      out[idx + 3] = 255
    }
  }

  return new ImageData(out, width, height)
}

function dilate(binarized: ImageData, radius = 1): ImageData {
  const { width, height, data: src } = binarized
  const out = new Uint8ClampedArray(src.length)
  out.fill(255)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      out[idx + 3] = 255

      if (src[idx] >= 128) continue // pixel déjà blanc, on cherche si un voisin est noir

      // Ce pixel est noir → dilater : marquer les voisins comme noirs
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const ni = (ny * width + nx) * 4
          out[ni] = 0; out[ni + 1] = 0; out[ni + 2] = 0
        }
      }
    }
  }

  return new ImageData(out, width, height)
}

/** Ouverture morphologique : érosion puis dilatation. Casse les connexions fines entre lettres cursives. */
function morphOpen(binarized: ImageData, radius = 1): ImageData {
  return dilate(erode(binarized, radius), radius)
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

// ─── Division des composants larges ─────────────────────

function verticalProjection(binarized: ImageData, comp: Component): number[] {
  const { width: imgW, data } = binarized
  const proj: number[] = []

  for (let x = comp.minX; x <= comp.maxX; x++) {
    let count = 0
    for (let y = comp.minY; y <= comp.maxY; y++) {
      if (data[(y * imgW + x) * 4] < 128) count++
    }
    proj.push(count)
  }
  return proj
}

function findSplitPoints(projection: number[], minValleyDepth: number): number[] {
  if (projection.length < 6) return []

  // Lisser la projection
  const smoothed = projection.map((_, i) => {
    let sum = 0, count = 0
    for (let j = Math.max(0, i - 2); j <= Math.min(projection.length - 1, i + 2); j++) {
      sum += projection[j]; count++
    }
    return sum / count
  })

  const maxVal = Math.max(...smoothed)
  if (maxVal === 0) return []

  // Trouver les vallées (minima locaux proches de 0)
  const valleys: { pos: number; depth: number }[] = []
  const margin = Math.floor(projection.length * 0.15) // Pas de split trop près des bords

  for (let i = margin; i < smoothed.length - margin; i++) {
    if (smoothed[i] <= minValleyDepth &&
        smoothed[i] <= smoothed[i - 1] &&
        smoothed[i] <= smoothed[i + 1]) {
      valleys.push({ pos: i, depth: smoothed[i] })
    }
  }

  // Trier par profondeur (les moins remplies d'abord)
  valleys.sort((a, b) => a.depth - b.depth)

  // Ne garder que les vallées suffisamment espacées
  const result: number[] = []
  for (const v of valleys) {
    if (result.every(r => Math.abs(r - v.pos) > projection.length * 0.2)) {
      result.push(v.pos)
    }
  }

  return result.sort((a, b) => a - b)
}

function splitWideComponents(
  components: Component[],
  binarized: ImageData,
  medianWidth: number
): Component[] {
  const result: Component[] = []
  const splitThreshold = medianWidth * 2.2 // Un composant plus de 2.2x la largeur médiane = probablement fusionné

  for (const comp of components) {
    if (comp.width <= splitThreshold) {
      result.push(comp)
      continue
    }

    // Projection verticale pour trouver les points de coupe
    const proj = verticalProjection(binarized, comp)
    const maxProj = Math.max(...proj)
    const splits = findSplitPoints(proj, maxProj * 0.15)

    if (splits.length === 0) {
      result.push(comp)
      continue
    }

    // Découper aux points de split
    const boundaries = [0, ...splits, proj.length - 1]
    for (let i = 0; i < boundaries.length - 1; i++) {
      const startX = comp.minX + boundaries[i]
      const endX = comp.minX + boundaries[i + 1]
      const w = endX - startX + 1

      if (w < medianWidth * 0.3) continue // Fragment trop petit

      // Recalculer minY/maxY pour ce segment
      let segMinY = comp.maxY, segMaxY = comp.minY
      let segArea = 0
      const imgW = binarized.width

      for (let x = startX; x <= endX; x++) {
        for (let y = comp.minY; y <= comp.maxY; y++) {
          if (binarized.data[(y * imgW + x) * 4] < 128) {
            if (y < segMinY) segMinY = y
            if (y > segMaxY) segMaxY = y
            segArea++
          }
        }
      }

      if (segArea > 10) {
        result.push({
          minX: startX,
          maxX: endX,
          minY: segMinY,
          maxY: segMaxY,
          width: w,
          height: segMaxY - segMinY + 1,
          area: segArea,
        })
      }
    }
  }

  return result
}

// ─── Regroupement multi-composants (accents, points) ────

function groupMultiPartCharacters(components: Component[], medianHeight: number): Component[] {
  if (components.length === 0) return []

  // Séparer les "petits" (accents, points) des "grands" (lettres)
  const smallThreshold = medianHeight * 0.4
  const smalls: Component[] = []
  const normals: Component[] = []

  for (const c of components) {
    if (c.height < smallThreshold && c.area < medianHeight * medianHeight * 0.15) {
      smalls.push(c)
    } else {
      normals.push(c)
    }
  }

  // Pour chaque petit composant, chercher s'il est au-dessus ou au-dessous d'un composant normal
  const merged = new Set<number>()
  const result = normals.map(n => ({ ...n }))

  for (let si = 0; si < smalls.length; si++) {
    const s = smalls[si]
    const sCx = (s.minX + s.maxX) / 2

    let bestIdx = -1
    let bestDist = Infinity

    for (let ni = 0; ni < result.length; ni++) {
      const n = result[ni]

      // Le petit doit chevaucher horizontalement le normal (au moins 30%)
      const overlapX = Math.min(s.maxX, n.maxX) - Math.max(s.minX, n.minX)
      const smallWidth = s.maxX - s.minX + 1
      if (overlapX < smallWidth * 0.3) continue

      // Proximité verticale
      const gap = s.minY > n.maxY
        ? s.minY - n.maxY  // Petit en dessous
        : n.minY > s.maxY
          ? n.minY - s.maxY  // Petit au-dessus
          : 0 // Chevauchement vertical

      if (gap > medianHeight * 0.6) continue // Trop loin

      const dist = Math.abs(sCx - (n.minX + n.maxX) / 2)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = ni
      }
    }

    if (bestIdx >= 0) {
      // Fusionner le petit dans le normal
      const n = result[bestIdx]
      n.minX = Math.min(n.minX, s.minX)
      n.maxX = Math.max(n.maxX, s.maxX)
      n.minY = Math.min(n.minY, s.minY)
      n.maxY = Math.max(n.maxY, s.maxY)
      n.width = n.maxX - n.minX + 1
      n.height = n.maxY - n.minY + 1
      n.area += s.area
      merged.add(si)
    }
  }

  // Ajouter les petits non fusionnés (s'ils sont assez gros pour être de la ponctuation)
  for (let si = 0; si < smalls.length; si++) {
    if (!merged.has(si) && smalls[si].area > 20) {
      result.push(smalls[si])
    }
  }

  return result
}

// ─── Filtrage statistique des composantes ───────────────

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function filterComponentsStatistical(components: Component[], imgWidth: number, imgHeight: number): {
  filtered: Component[]
  medianWidth: number
  medianHeight: number
} {
  // Pré-filtrage grossier (enlever le bruit évident et les énormes blobs)
  const minArea = 15
  const maxAreaRatio = 0.02 // Max 2% de l'image
  const imgArea = imgWidth * imgHeight

  const preFiltered = components.filter(c => {
    if (c.area < minArea) return false
    if (c.area > imgArea * maxAreaRatio) return false
    if (c.width < 4 || c.height < 4) return false
    if (c.width > imgWidth * 0.2 || c.height > imgHeight * 0.15) return false
    return true
  })

  if (preFiltered.length === 0) return { filtered: [], medianWidth: 0, medianHeight: 0 }

  // Calculer les médianes
  const medianW = computeMedian(preFiltered.map(c => c.width))
  const medianH = computeMedian(preFiltered.map(c => c.height))
  const medianArea = computeMedian(preFiltered.map(c => c.area))

  // Filtrage basé sur les statistiques (±3x la médiane)
  const filtered = preFiltered.filter(c => {
    if (c.width < medianW * 0.15 || c.width > medianW * 5) return false
    if (c.height < medianH * 0.15 || c.height > medianH * 5) return false
    if (c.area < medianArea * 0.05) return false

    // Ratio d'aspect raisonnable
    const aspect = c.width / c.height
    if (aspect > 5 || aspect < 0.12) return false

    return true
  })

  return { filtered, medianWidth: medianW, medianHeight: medianH }
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

// ─── Création du montage numéroté (amélioré) ────────────

const CELL_SIZE = 120 // Plus grand pour meilleure lisibilité par Claude
const MONTAGE_COLS = 8
const MAX_COMPONENTS = 150

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

    // Extraire l'image du composant avec une marge proportionnelle
    const marginX = Math.max(6, Math.round(comp.width * 0.2))
    const marginY = Math.max(6, Math.round(comp.height * 0.2))
    const srcX = Math.max(0, comp.minX - marginX)
    const srcY = Math.max(0, comp.minY - marginY)
    const srcW = Math.min(comp.width + marginX * 2, sourceCanvas.width - srcX)
    const srcH = Math.min(comp.height + marginY * 2, sourceCanvas.height - srcY)

    // Sauvegarder l'image du composant
    const compCanvas = document.createElement('canvas')
    compCanvas.width = srcW
    compCanvas.height = srcH
    const compCtx = compCanvas.getContext('2d')!
    compCtx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
    componentImages.push(compCtx.getImageData(0, 0, srcW, srcH))

    // Dessiner dans la cellule (centré, mis à l'échelle)
    const topPad = 18 // Place pour le numéro
    const pad = 10
    const availW = CELL_SIZE - pad * 2
    const availH = CELL_SIZE - topPad - pad
    const scale = Math.min(availW / srcW, availH / srcH, 2.5)
    const drawW = srcW * scale
    const drawH = srcH * scale
    const drawX = cellX + (CELL_SIZE - drawW) / 2
    const drawY = cellY + topPad + (availH - drawH) / 2

    // Fond de cellule légèrement coloré pour le contraste
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(cellX + 1, cellY + 1, CELL_SIZE - 2, CELL_SIZE - 2)

    ctx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, drawX, drawY, drawW, drawH)

    // Numéro avec fond pour la lisibilité
    const numText = `${i + 1}`
    ctx.font = 'bold 13px sans-serif'
    const numW = ctx.measureText(numText).width
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillRect(cellX + 2, cellY + 1, numW + 6, 16)
    ctx.fillStyle = '#dc2626'
    ctx.fillText(numText, cellX + 5, cellY + 14)

    // Bordure de cellule
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
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

// ─── Pipeline principal (v3 amélioré) ───────────────────

/**
 * Étape 1 : Traitement d'image côté client.
 * Amélioration de contraste → Seuillage adaptatif Sauvola →
 * Ouverture morphologique → Composantes connexes →
 * Division des composants larges → Regroupement multi-composants →
 * Filtrage statistique → Tri → Montage numéroté
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

  // 1. Amélioration du contraste
  onProgress?.('Amélioration du contraste...')
  const raw = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const enhanced = enhanceContrast(raw)

  await new Promise((r) => requestAnimationFrame(r))

  // 2. Seuillage adaptatif de Sauvola (bien meilleur que Otsu global pour les photos)
  onProgress?.('Binarisation adaptative (Sauvola)...')
  const windowSize = Math.max(15, Math.round(Math.min(canvas.width, canvas.height) * 0.02))
  const bin = sauvolaBinarize(enhanced, windowSize, 0.2)

  await new Promise((r) => requestAnimationFrame(r))

  // 3. Ouverture morphologique pour casser les connexions cursives
  onProgress?.('Séparation des lettres cursives...')
  const opened = morphOpen(bin, 1)

  await new Promise((r) => requestAnimationFrame(r))

  // 4. Détection des composantes connexes
  onProgress?.('Détection des caractères...')
  const rawComponents = findConnectedComponents(opened)
  onProgress?.(`${rawComponents.length} éléments bruts détectés`)

  await new Promise((r) => requestAnimationFrame(r))

  // 5. Filtrage statistique initial
  onProgress?.('Filtrage statistique...')
  const { filtered: preFiltered, medianWidth, medianHeight } =
    filterComponentsStatistical(rawComponents, bin.width, bin.height)
  onProgress?.(`${preFiltered.length} éléments après filtrage initial (médiane: ${Math.round(medianWidth)}×${Math.round(medianHeight)}px)`)

  if (preFiltered.length === 0) {
    return { montageBase64: '', componentImages: [], componentCount: 0 }
  }

  // 6. Division des composants trop larges (mots fusionnés)
  onProgress?.('Division des composants larges...')
  const split = splitWideComponents(preFiltered, opened, medianWidth)
  onProgress?.(`${split.length} éléments après division`)

  // 7. Regroupement multi-composants (accents + lettres de base)
  onProgress?.('Regroupement des accents et diacritiques...')
  const grouped = groupMultiPartCharacters(split, medianHeight)
  onProgress?.(`${grouped.length} caractères après regroupement`)

  // 8. Re-filtrage final
  const finalFiltered = grouped.filter(c => {
    const aspect = c.width / c.height
    return aspect < 4 && aspect > 0.1 && c.area > 15
  })

  // 9. Tri en ordre de lecture
  const sorted = sortReadingOrder(finalFiltered)
  onProgress?.(`${sorted.length} caractères potentiels, création du montage...`)

  // 10. Créer le montage avec l'image ORIGINALE (pas binarisée) pour meilleure lisibilité
  const originalCanvas = document.createElement('canvas')
  originalCanvas.width = img.naturalWidth
  originalCanvas.height = img.naturalHeight
  const origCtx = originalCanvas.getContext('2d')!
  origCtx.drawImage(img, 0, 0)

  const { dataUrl, componentImages } = createMontage(sorted, originalCanvas)

  // Extraire le base64
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

// ─── Pipeline guidé par transcription Claude (v4) ───────

/**
 * Parse une ligne transcrite par Claude.
 * Format : "P â t e ▪ b r a i s é" → ['P','â','t','e',' ','b','r','a','i','s','é']
 * Le ▪ représente un espace entre mots.
 */
function parseTranscribedLine(line: string): string[] {
  const tokens = line.split(' ')
  const chars: string[] = []

  for (const token of tokens) {
    if (token === '▪') {
      chars.push(' ') // Espace entre mots
    } else if (token.length === 1) {
      chars.push(token)
    }
    // Ignorer les tokens vides ou multi-caractères (erreurs)
  }

  return chars
}

/**
 * Groupe les composants en lignes de texte basé sur la position Y.
 */
function groupIntoLines(components: Component[], medianHeight: number): Component[][] {
  if (components.length === 0) return []

  const sorted = [...components].sort((a, b) => {
    const aCy = (a.minY + a.maxY) / 2
    const bCy = (b.minY + b.maxY) / 2
    return aCy - bCy
  })

  const lines: Component[][] = []
  let currentLine: Component[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const prevCy = currentLine.reduce((s, c) => s + (c.minY + c.maxY) / 2, 0) / currentLine.length
    const currCy = (sorted[i].minY + sorted[i].maxY) / 2

    if (Math.abs(currCy - prevCy) < medianHeight * 0.7) {
      currentLine.push(sorted[i])
    } else {
      // Trier la ligne gauche→droite
      currentLine.sort((a, b) => a.minX - b.minX)
      lines.push(currentLine)
      currentLine = [sorted[i]]
    }
  }
  currentLine.sort((a, b) => a.minX - b.minX)
  lines.push(currentLine)

  return lines
}

/**
 * Détecte les espaces entre mots dans une ligne de composants.
 * Retourne les indices où il y a un espace (gaps significativement plus grands).
 */
function detectWordGaps(lineComponents: Component[]): Set<number> {
  if (lineComponents.length < 2) return new Set()

  const gaps: number[] = []
  for (let i = 1; i < lineComponents.length; i++) {
    gaps.push(lineComponents[i].minX - lineComponents[i - 1].maxX)
  }

  const medianGap = computeMedian(gaps)
  const spaceIndices = new Set<number>()

  // Un gap > 2x le gap médian est probablement un espace entre mots
  for (let i = 0; i < gaps.length; i++) {
    if (gaps[i] > medianGap * 2.2 && gaps[i] > 5) {
      spaceIndices.add(i + 1) // Après le composant i, il y a un espace
    }
  }

  return spaceIndices
}

/**
 * Aligne les composants d'une ligne avec les caractères de la transcription.
 * Retourne un tableau de paires (composant, caractère assigné).
 */
function alignLineWithTranscription(
  lineComponents: Component[],
  lineChars: string[]
): { comp: Component; char: string }[] {
  const results: { comp: Component; char: string }[] = []

  // Détecter les espaces dans la ligne de composants
  const spaceGaps = detectWordGaps(lineComponents)

  // Construire la séquence de composants avec marqueurs d'espace
  const compSequence: (Component | 'space')[] = []
  for (let i = 0; i < lineComponents.length; i++) {
    compSequence.push(lineComponents[i])
    if (spaceGaps.has(i + 1)) {
      compSequence.push('space')
    }
  }

  // Aligner séquentiellement les composants avec les caractères
  let charIdx = 0
  for (const item of compSequence) {
    if (item === 'space') {
      // Avancer dans la transcription jusqu'au prochain espace
      while (charIdx < lineChars.length && lineChars[charIdx] !== ' ') {
        charIdx++
      }
      if (charIdx < lineChars.length) charIdx++ // Passer l'espace
      continue
    }

    // C'est un composant — trouver la prochaine lettre (non-espace)
    while (charIdx < lineChars.length && lineChars[charIdx] === ' ') {
      charIdx++
    }

    if (charIdx < lineChars.length) {
      results.push({ comp: item, char: lineChars[charIdx] })
      charIdx++
    }
  }

  return results
}

/**
 * Extraction guidée par transcription :
 * 1. Traitement d'image (contraste, binarisation Sauvola, morpho)
 * 2. Détection de composants + organisation en lignes
 * 3. Alignement composants ↔ caractères de la transcription Claude
 * 4. Construction de la map caractère → glyphe
 */
export async function guidedExtraction(
  imageUrl: string,
  transcribedLines: string[],
  onProgress?: (msg: string) => void
): Promise<Map<string, CroppedGlyph>> {
  onProgress?.('Chargement de l\'image...')
  const img = await loadImage(imageUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // 1. Traitement d'image
  onProgress?.('Amélioration du contraste...')
  const raw = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const enhanced = enhanceContrast(raw)

  await new Promise((r) => requestAnimationFrame(r))

  onProgress?.('Binarisation adaptative (Sauvola)...')
  const windowSize = Math.max(15, Math.round(Math.min(canvas.width, canvas.height) * 0.02))
  const bin = sauvolaBinarize(enhanced, windowSize, 0.2)

  await new Promise((r) => requestAnimationFrame(r))

  onProgress?.('Séparation des lettres...')
  const opened = morphOpen(bin, 1)

  await new Promise((r) => requestAnimationFrame(r))

  // 2. Composantes connexes + filtrage + regroupement
  onProgress?.('Détection des composantes...')
  const rawComponents = findConnectedComponents(opened)

  const { filtered: preFiltered, medianWidth, medianHeight } =
    filterComponentsStatistical(rawComponents, bin.width, bin.height)

  if (preFiltered.length === 0 || medianHeight === 0) {
    return new Map()
  }

  onProgress?.('Division et regroupement...')
  const split = splitWideComponents(preFiltered, opened, medianWidth)
  const grouped = groupMultiPartCharacters(split, medianHeight)

  // Filtrage final
  const finalFiltered = grouped.filter(c => {
    const aspect = c.width / c.height
    return aspect < 4 && aspect > 0.1 && c.area > 15
  })

  // 3. Organiser en lignes
  onProgress?.('Organisation en lignes de texte...')
  const compLines = groupIntoLines(finalFiltered, medianHeight)

  onProgress?.(`${compLines.length} lignes de composants, ${transcribedLines.length} lignes transcrites`)

  // 4. Parser les lignes transcrites
  const parsedLines = transcribedLines.map(parseTranscribedLine)

  // 5. Aligner chaque ligne de composants avec la transcription
  const result = new Map<string, CroppedGlyph>()
  let totalMatched = 0

  // Canvas original pour extraire les images en couleur
  const origCanvas = document.createElement('canvas')
  origCanvas.width = img.naturalWidth
  origCanvas.height = img.naturalHeight
  const origCtx = origCanvas.getContext('2d')!
  origCtx.drawImage(img, 0, 0)

  // Aligner les lignes de composants avec les lignes transcrites
  const minLines = Math.min(compLines.length, parsedLines.length)

  for (let li = 0; li < minLines; li++) {
    const aligned = alignLineWithTranscription(compLines[li], parsedLines[li])

    onProgress?.(`Ligne ${li + 1}/${minLines} : ${aligned.length} caractères alignés`)

    for (const { comp, char } of aligned) {
      if (char === ' ') continue // Ignorer les espaces
      if (result.has(char)) continue // Déjà trouvé ce caractère

      // Extraire l'image du composant avec marge
      const marginX = Math.max(6, Math.round(comp.width * 0.25))
      const marginY = Math.max(6, Math.round(comp.height * 0.25))
      const srcX = Math.max(0, comp.minX - marginX)
      const srcY = Math.max(0, comp.minY - marginY)
      const srcW = Math.min(comp.width + marginX * 2, origCanvas.width - srcX)
      const srcH = Math.min(comp.height + marginY * 2, origCanvas.height - srcY)

      const compCanvas = document.createElement('canvas')
      compCanvas.width = srcW
      compCanvas.height = srcH
      const compCtx = compCanvas.getContext('2d')!
      compCtx.drawImage(origCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)

      const imageData = compCtx.getImageData(0, 0, srcW, srcH)
      const binData = binarize(imageData)

      result.set(char, {
        character: char,
        imageData,
        binarized: binData,
        dataUrl: imageDataToDataUrl(imageData),
        confidence: 0.85,
      })
      totalMatched++
    }

    if (li % 3 === 0) await new Promise((r) => requestAnimationFrame(r))
  }

  onProgress?.(`${totalMatched} caractères uniques extraits`)
  return result
}

/**
 * Prépare l'image pour l'envoi à Claude (redimensionnement si nécessaire + base64).
 */
export async function prepareImageForTranscription(imageUrl: string): Promise<string> {
  const img = await loadImage(imageUrl)

  const canvas = document.createElement('canvas')
  // Limiter la taille pour Claude (max ~2000px de large)
  const maxDim = 2000
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
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
