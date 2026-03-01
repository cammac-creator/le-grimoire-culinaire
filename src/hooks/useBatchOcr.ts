import { useCallback, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS, type OcrResult } from '@/types'
import type { PdfPage } from '@/lib/pdf-extractor'

export type PageStatus = 'pending' | 'uploading' | 'processing' | 'done' | 'error'

export interface BatchPageState {
  pageNumber: number
  thumbnailUrl: string
  imageBlob: Blob
  status: PageStatus
  error?: string
  storagePath?: string
  imageUrl?: string
  ocrResult?: OcrResult
}

async function callOcrFunction(imageUrl: string): Promise<OcrResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

  const res = await fetch(`${supabaseUrl}/functions/v1/ocr-recipe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({ image_url: imageUrl }),
  })

  const body = await res.json()

  if (!res.ok) {
    throw new Error(body.error ?? `Erreur OCR (HTTP ${res.status})`)
  }

  return body as OcrResult
}

export function useBatchOcr() {
  const [pages, setPages] = useState<BatchPageState[]>([])
  const abortRef = useRef(false)

  const initPages = useCallback((pdfPages: PdfPage[], selected: Set<number>) => {
    setPages(
      pdfPages
        .filter((p) => selected.has(p.pageNumber))
        .map((p) => ({
          pageNumber: p.pageNumber,
          thumbnailUrl: p.thumbnailUrl,
          imageBlob: p.imageBlob,
          status: 'pending' as const,
        })),
    )
  }, [])

  const updatePage = useCallback(
    (pageNumber: number, update: Partial<BatchPageState>) => {
      setPages((prev) =>
        prev.map((p) => (p.pageNumber === pageNumber ? { ...p, ...update } : p)),
      )
    },
    [],
  )

  const processOnePage = useCallback(
    async (page: BatchPageState) => {
      try {
        // Upload
        updatePage(page.pageNumber, { status: 'uploading' })
        const fileName = `ocr-batch/${Date.now()}-p${page.pageNumber}-${Math.random().toString(36).slice(2)}.jpg`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.sources)
          .upload(fileName, page.imageBlob, { contentType: 'image/jpeg' })

        if (uploadError) {
          updatePage(page.pageNumber, { status: 'error', error: `Upload: ${uploadError.message}` })
          return
        }

        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKETS.sources)
          .getPublicUrl(fileName)

        const imageUrl = urlData.publicUrl
        updatePage(page.pageNumber, { status: 'processing', storagePath: fileName, imageUrl })

        // OCR via direct fetch
        const ocrResult = await callOcrFunction(imageUrl)
        updatePage(page.pageNumber, { status: 'done', ocrResult })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        updatePage(page.pageNumber, { status: 'error', error: message })
      }
    },
    [updatePage],
  )

  const processAll = useCallback(async () => {
    abortRef.current = false

    // Process sequentially to avoid auth race conditions
    for (let i = 0; i < pages.length; i++) {
      if (abortRef.current) break
      const page = pages[i]
      if (page.status !== 'pending') continue
      await processOnePage(page)
    }
  }, [pages, processOnePage])

  const retryPage = useCallback(
    async (pageNumber: number) => {
      const page = pages.find((p) => p.pageNumber === pageNumber)
      if (!page) return
      updatePage(pageNumber, { status: 'pending', error: undefined })
      await processOnePage({ ...page, status: 'pending', error: undefined })
    },
    [pages, processOnePage, updatePage],
  )

  const removePage = useCallback((pageNumber: number) => {
    setPages((prev) => prev.filter((p) => p.pageNumber !== pageNumber))
  }, [])

  const doneCount = pages.filter((p) => p.status === 'done').length
  const errorCount = pages.filter((p) => p.status === 'error').length
  const isProcessing = pages.some((p) => p.status === 'uploading' || p.status === 'processing')

  return {
    pages,
    initPages,
    processAll,
    retryPage,
    removePage,
    updatePage,
    doneCount,
    errorCount,
    isProcessing,
  }
}
