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

const OCR_TIMEOUT_MS = 60_000 // 60s par page (Claude Sonnet sur image manuscrite)
const MAX_RETRIES = 2 // 1 essai initial + 2 retries = 3 tentatives max

async function callOcrFunction(imageUrl: string): Promise<OcrResult> {
  // supabase.functions.invoke n'accepte pas signal — on wrappe avec une race
  const ocrPromise = supabase.functions
    .invoke('ocr-recipe', { body: { image_url: imageUrl } })
    .then(({ data, error }) => {
      if (error) throw error
      return data as OcrResult
    })
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout après ${OCR_TIMEOUT_MS / 1000}s`)), OCR_TIMEOUT_MS),
  )
  return Promise.race([ocrPromise, timeoutPromise])
}

async function callOcrWithRetry(imageUrl: string): Promise<OcrResult> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOcrFunction(imageUrl)
    } catch (err) {
      lastErr = err
      const msg = err instanceof Error ? err.message : String(err)
      // Pas de retry sur erreurs définitives (4xx hors 429)
      if (/4\d\d/.test(msg) && !/429/.test(msg)) throw err
      if (attempt < MAX_RETRIES) {
        // Backoff exponentiel : 2s, 5s
        const delay = attempt === 0 ? 2000 : 5000
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('OCR a échoué après retries')
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

        // OCR avec timeout 60s + 2 retries automatiques (timeout, 5xx, 429)
        const ocrResult = await callOcrWithRetry(imageUrl)
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
    setPages((prev) => {
      const target = prev.find((p) => p.pageNumber === pageNumber)
      // Cleanup best-effort de l'image orpheline dans Storage (sinon coût accumulé)
      if (target?.storagePath) {
        void supabase.storage
          .from(STORAGE_BUCKETS.sources)
          .remove([target.storagePath])
          .catch(() => undefined)
      }
      return prev.filter((p) => p.pageNumber !== pageNumber)
    })
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
