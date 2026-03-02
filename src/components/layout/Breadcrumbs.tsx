import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const PATH_LABELS: Record<string, string> = {
  '': 'Accueil',
  search: 'Rechercher',
  recipes: 'Recettes',
  new: 'Nouvelle recette',
  edit: 'Modifier',
  'my-recipes': 'Mes recettes',
  favorites: 'Favoris',
  'shopping-list': 'Courses',
  'meal-planner': 'Planificateur',
  ocr: 'Scanner',
  import: 'Import PDF',
  'import-url': 'Import URL',
  'book-builder': 'Livre',
  'font-creator': 'Polices',
  'pressure-cooker': 'Cocotte pression',
  login: 'Connexion',
  register: 'Inscription',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  if (pathname === '/') return null

  const segments = pathname.split('/').filter(Boolean)

  // Skip UUID segments for display
  const crumbs = segments.map((segment, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const label = PATH_LABELS[segment] || (segment.length > 20 ? '...' : segment)
    return { path, label }
  })

  return (
    <nav aria-label="Fil d'Ariane" className="mx-auto max-w-7xl px-4 py-2">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link to="/" className="flex items-center hover:text-foreground">
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {i === crumbs.length - 1 ? (
              <span className="text-foreground">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
