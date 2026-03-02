import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MotionDiv, useReducedMotion } from '@/lib/motion'
import { SmartDropZone } from '@/components/add/SmartDropZone'
import { SingleImageFlow } from '@/components/add/SingleImageFlow'
import { PdfBatchFlow } from '@/components/add/PdfBatchFlow'
import { UrlScrapeFlow } from '@/components/add/UrlScrapeFlow'
import { ManualFlow } from '@/components/add/ManualFlow'

type Mode =
  | { type: 'idle' }
  | { type: 'image'; file: File }
  | { type: 'pdf'; file: File }
  | { type: 'url'; url: string }
  | { type: 'manual' }

const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
}

export default function UnifiedAddRecipe() {
  const [mode, setMode] = useState<Mode>({ type: 'idle' })
  const reduced = useReducedMotion()

  const goBack = () => setMode({ type: 'idle' })

  const renderContent = () => {
    switch (mode.type) {
      case 'idle':
        return (
          <SmartDropZone
            onImage={(file) => setMode({ type: 'image', file })}
            onPdf={(file) => setMode({ type: 'pdf', file })}
            onUrl={(url) => setMode({ type: 'url', url })}
            onManual={() => setMode({ type: 'manual' })}
          />
        )
      case 'image':
        return <SingleImageFlow file={mode.file} onBack={goBack} />
      case 'pdf':
        return <PdfBatchFlow file={mode.file} onBack={goBack} />
      case 'url':
        return <UrlScrapeFlow url={mode.url} onBack={goBack} />
      case 'manual':
        return <ManualFlow onBack={goBack} />
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {reduced ? (
        renderContent()
      ) : (
        <AnimatePresence mode="wait">
          <MotionDiv
            key={mode.type}
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderContent()}
          </MotionDiv>
        </AnimatePresence>
      )}
    </div>
  )
}
