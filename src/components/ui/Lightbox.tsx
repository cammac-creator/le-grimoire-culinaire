import { useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface LightboxProps {
  images: { src: string; alt: string }[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

export function Lightbox({ images, initialIndex = 0, open, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const reduced = useReducedMotion()

  const prev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length])
  const next = useCallback(() => setIndex((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  }, [onClose, prev, next])

  if (!open || images.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
        initial={reduced ? undefined : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="dialog"
        aria-label="Visionneuse d'images"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Fermer"
        >
          <X className="h-6 w-6" />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Image precedente"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <motion.img
          key={index}
          src={images[index].src}
          alt={images[index].alt}
          className="max-h-[90vh] max-w-[90vw] object-contain select-none"
          onClick={(e) => e.stopPropagation()}
          drag={reduced ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, info) => {
            if (Math.abs(info.offset.x) > 100) {
              info.offset.x > 0 ? prev() : next()
            }
          }}
          initial={reduced ? undefined : { opacity: 0, scale: 0.9 }}
          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        />

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {index + 1} / {images.length}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
