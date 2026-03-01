import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return

      switch (e.key) {
        case '/': {
          e.preventDefault()
          // Find and click the search button in the header
          const searchBtn = document.querySelector<HTMLButtonElement>('[aria-label="Recherche rapide"]')
          searchBtn?.click()
          break
        }
        case 'n': {
          if (isAuthenticated) {
            e.preventDefault()
            navigate('/recipes/new')
          }
          break
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate, isAuthenticated])
}
