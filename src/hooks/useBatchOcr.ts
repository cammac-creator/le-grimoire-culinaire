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

const CONCURRENCY = 2

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
      // Upload
      updatePage(page.pageNumber, { status: 'uploading' })
      const ext = 'png'
      const fileName = `ocr-batch/${Date.now()}-p${page.pageNumber}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.sources)
        .upload(fileName, page.imageBlob, { contentType: 'image/png' })

      if (uploadError) {
        updatePage(page.pageNumber, { status: 'error', error: uploadError.message })
        return
      }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.sources)
        .getPublicUrl(fileName)

      const imageUrl = urlData.publicUrl
      updatePage(page.pageNumber, { status: 'processing', storagePath: fileName, imageUrl })

      // OCR
      const { data, error: ocrError } = await supabase.functions.invoke('ocr-recipe', {
        body: { image_url: imageUrl },
      })

      if (ocrError) {
        updatePage(page.pageNumber, { status: 'error', error: ocrError.message })
        return
      }

      updatePage(page.pageNumber, { status: 'done', ocrResult: data as OcrResult })
    },
    [updatePage],
  )

  const processAll = useCallback(async () => {
    abortRef.current = false

    // Process with limited concurrency
    let nextIndex = 0

    const runNext = async (): Promise<void> => {
      while (nextIndex < pages.length && !abortRef.current) {
        const idx = nextIndex++
        const page = pages[idx]
        if (page.status !== 'pending') continue
        await processOnePage(page)
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => runNext())
    await Promise.all(workers)
  }, [pages, processOnePage])

  const retryPage = useCallback(
    async (pageNumber: number) => {
      const page = pages.find((p) => p.pageNumber === pageNumber)
      if (!page) return
      updatePage(pageNumber, { status: 'pending', error: undefined })
      // Re-read the page state after update (use the original blob)
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
