import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const { t } = useLocale()
  if (pathname === '/') return null

  const PATH_LABELS: Record<string, string> = {
    '': t('bc.home'),
    search: t('bc.search'),
    recipes: t('bc.recipes'),
    new: t('bc.newRecipe'),
    edit: t('bc.edit'),
    'my-recipes': t('bc.myRecipes'),
    favorites: t('bc.favorites'),
    'shopping-list': t('bc.shopping'),
    'meal-planner': t('bc.planner'),
    ocr: t('bc.scanner'),
    import: t('bc.importPdf'),
    'import-url': t('bc.importUrl'),
    'book-builder': t('bc.bookBuilder'),
    'font-creator': t('bc.fonts'),
    'pressure-cooker': t('bc.pressureCooker'),
    login: t('bc.login'),
    register: t('bc.register'),
  }

  const segments = pathname.split('/').filter(Boolean)

  // Skip UUID segments for display
  const crumbs = segments.map((segment, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const label = PATH_LABELS[segment] || (segment.length > 20 ? '...' : segment)
    return { path, label }
  })

  return (
    <nav aria-label="Breadcrumbs" className="mx-auto max-w-7xl px-4 py-2">
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
