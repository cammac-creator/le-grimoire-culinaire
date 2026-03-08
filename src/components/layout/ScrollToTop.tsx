import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ScrollToTop() {
  const { pathname } = useLocation()
  const prevPath = useRef(pathname)
  const [visible, setVisible] = useState(false)

  // Scroll to top & manage focus on route change
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      window.scrollTo(0, 0)
      const main = document.getElementById('main')
      main?.focus({ preventScroll: true })
    }
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <Button
      variant="secondary"
      size="icon"
      className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg transition-opacity"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Retour en haut"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
