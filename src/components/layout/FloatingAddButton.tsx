import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function FloatingAddButton() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <Link
        to="/recipes/new"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Ajouter une recette"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
