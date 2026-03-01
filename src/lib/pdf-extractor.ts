import * as pdfjsLib from 'pdfjs-dist'

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface PdfPage {
  pageNumber: number
  imageBlob: Blob
  thumbnailUrl: string
}

interface ExtractOptions {
  scale?: number
  onProgress?: (done: number, total: number) => void
}

export async function extractPagesFromPdf(
  file: File,
  { scale = 1.5, onProgress }: ExtractOptions = {},
): Promise<PdfPage[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const total = pdf.numPages
  const pages: PdfPage[] = []

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvas, canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]).promise

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        0.75,
      )
    })

    const thumbnailUrl = URL.createObjectURL(blob)
    pages.push({ pageNumber: i, imageBlob: blob, thumbnailUrl })

    onProgress?.(i, total)

    // Let the UI breathe between pages
    if (i < total) await new Promise((r) => setTimeout(r, 0))
  }

  return pages
}
