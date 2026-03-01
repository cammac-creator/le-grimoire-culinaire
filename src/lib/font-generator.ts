import type { CroppedGlyph } from './character-extractor'

// Import dynamique pour éviter de charger ces libs au démarrage
async function getOpentype() {
  const mod = await import('opentype.js')
  return mod.default ?? mod
}

async function getImageTracer() {
  const mod = await import('imagetracerjs')
  return mod.default ?? mod
}

/**
 * Vectorise un glyphe binarisé en chemin SVG via ImageTracerJS.
 */
export async function vectorizeGlyph(binarized: ImageData): Promise<string> {
  const ImageTracer = await getImageTracer()

  // ImageTracerJS attend un objet canvas-like avec getImageData
  const canvas = document.createElement('canvas')
  canvas.width = binarized.width
  canvas.height = binarized.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(binarized, 0, 0)

  // Tracer vers SVG
  const svgString: string = ImageTracer.imagedataToSVG(binarized, {
    ltres: 0.1,
    qtres: 1,
    pathomit: 4,
    colorsampling: 0,
    numberofcolors: 2,
    blurradius: 0,
    blurdelta: 20,
    strokewidth: 0,
    scale: 1,
  })

  // Extraire le premier path "d" non-vide (le glyphe noir)
  const pathMatch = svgString.match(/d="([^"]+)"/)
  return pathMatch?.[1] ?? ''
}

/**
 * Parse un attribut "d" SVG en commandes opentype.js Path.
 * Gère M, L, Q, C, Z et les inversions Y nécessaires pour les polices.
 */
export function svgPathToOpentypePath(
  svgD: string,
  opentype: ReturnType<typeof createOpentypePath>,
  glyphHeight: number,
  scale: number
): void {
  const commands = svgD.match(/[MLQCZmlqcz][^MLQCZmlqcz]*/g) ?? []

  let curX = 0
  let curY = 0

  for (const cmd of commands) {
    const type = cmd[0]
    const nums = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number)

    const flipY = (y: number) => (glyphHeight - y) * scale

    switch (type) {
      case 'M':
        curX = nums[0]
        curY = nums[1]
        opentype.moveTo(curX * scale, flipY(curY))
        break
      case 'm':
        curX += nums[0]
        curY += nums[1]
        opentype.moveTo(curX * scale, flipY(curY))
        break
      case 'L':
        curX = nums[0]
        curY = nums[1]
        opentype.lineTo(curX * scale, flipY(curY))
        break
      case 'l':
        curX += nums[0]
        curY += nums[1]
        opentype.lineTo(curX * scale, flipY(curY))
        break
      case 'Q':
        opentype.quadraticCurveTo(
          nums[0] * scale,
          flipY(nums[1]),
          nums[2] * scale,
          flipY(nums[3])
        )
        curX = nums[2]
        curY = nums[3]
        break
      case 'q':
        opentype.quadraticCurveTo(
          (curX + nums[0]) * scale,
          flipY(curY + nums[1]),
          (curX + nums[2]) * scale,
          flipY(curY + nums[3])
        )
        curX += nums[2]
        curY += nums[3]
        break
      case 'C':
        opentype.curveTo(
          nums[0] * scale,
          flipY(nums[1]),
          nums[2] * scale,
          flipY(nums[3]),
          nums[4] * scale,
          flipY(nums[5])
        )
        curX = nums[4]
        curY = nums[5]
        break
      case 'c':
        opentype.curveTo(
          (curX + nums[0]) * scale,
          flipY(curY + nums[1]),
          (curX + nums[2]) * scale,
          flipY(curY + nums[3]),
          (curX + nums[4]) * scale,
          flipY(curY + nums[5])
        )
        curX += nums[4]
        curY += nums[5]
        break
      case 'Z':
      case 'z':
        opentype.close()
        break
    }
  }
}

function createOpentypePath(opentype: { Path: new () => OpentypePath }) {
  return new opentype.Path()
}

interface OpentypePath {
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void
  curveTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number): void
  close(): void
  commands: unknown[]
}

const UNITS_PER_EM = 1000
const ASCENDER = 800
const DESCENDER = -200

/**
 * Assemble une police TTF complète à partir des glyphes vectorisés.
 */
export async function assembleFont(
  glyphs: Map<string, CroppedGlyph>,
  fontName: string,
  authorName: string,
  onProgress?: (current: number, total: number) => void
): Promise<ArrayBuffer> {
  const opentype = await getOpentype()

  // Glyphe .notdef (rectangle vide obligatoire)
  const notdefPath = new opentype.Path()
  notdefPath.moveTo(100, 0)
  notdefPath.lineTo(100, 700)
  notdefPath.lineTo(500, 700)
  notdefPath.lineTo(500, 0)
  notdefPath.close()

  const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 600,
    path: notdefPath,
  })

  // Glyphe espace
  const spacePath = new opentype.Path()
  const spaceGlyph = new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: 300,
    path: spacePath,
  })

  const fontGlyphs = [notdefGlyph, spaceGlyph]
  const entries = Array.from(glyphs.entries())

  for (let i = 0; i < entries.length; i++) {
    const [char, croppedGlyph] = entries[i]
    const unicode = char.codePointAt(0)
    if (!unicode) continue

    try {
      const svgD = await vectorizeGlyph(croppedGlyph.binarized)
      if (!svgD) continue

      const path = new opentype.Path()
      const glyphHeight = croppedGlyph.binarized.height
      const scale = UNITS_PER_EM / Math.max(glyphHeight, 1)

      svgPathToOpentypePath(svgD, path, glyphHeight, scale)

      if (path.commands.length === 0) continue

      const advanceWidth = Math.round(croppedGlyph.binarized.width * scale)

      const glyph = new opentype.Glyph({
        name: char,
        unicode,
        advanceWidth: Math.max(advanceWidth, 200),
        path,
      })

      fontGlyphs.push(glyph)
    } catch {
      // Ignorer les glyphes qui échouent à la vectorisation
    }

    onProgress?.(i + 1, entries.length)

    // Céder le thread
    if (i % 5 === 0) {
      await new Promise((r) => requestAnimationFrame(r))
    }
  }

  const font = new opentype.Font({
    familyName: fontName,
    styleName: 'Regular',
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs: fontGlyphs,
    // Metadata
    description: `Police manuscrite de ${authorName}`,
    designer: authorName,
  })

  return font.download() ?? font.toArrayBuffer()
}

/**
 * Convertit un ArrayBuffer en Blob pour upload.
 */
export function fontArrayBufferToBlob(buffer: ArrayBuffer): Blob {
  return new Blob([buffer], { type: 'font/ttf' })
}
