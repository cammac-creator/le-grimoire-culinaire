import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Camera, FileStack, Link2 } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

const menuItems = [
  { to: '/recipes/new', label: 'Nouvelle recette', icon: Plus },
  { to: '/ocr', label: 'Scanner (OCR)', icon: Camera },
  { to: '/import', label: 'Import PDF', icon: FileStack },
  { to: '/import-url', label: 'Import URL', icon: Link2 },
]

export function FloatingAddButton() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()

  if (!isAuthenticated) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-16 right-0 flex flex-col gap-2"
            initial={reduced ? undefined : { opacity: 0, y: 10 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 10 }}
          >
            {menuItems.map((item, i) => (
              <motion.div
                key={item.to}
                initial={reduced ? undefined : { opacity: 0, scale: 0.8 }}
                animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-full bg-card px-4 py-2.5 shadow-lg border border-border whitespace-nowrap text-sm font-medium hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        initial={reduced ? undefined : { scale: 0 }}
        animate={reduced ? undefined : { scale: 1, rotate: open ? 45 : 0 }}
        whileHover={reduced ? undefined : { scale: 1.1 }}
        whileTap={reduced ? undefined : { scale: 0.95 }}
        aria-label={open ? 'Fermer le menu' : 'Ajouter une recette'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </motion.button>
    </div>
  )
}
