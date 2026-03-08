import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Heart, MoreHorizontal, Plus, ShoppingCart, Gauge, CalendarDays, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const mainTabs = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/search', label: 'Chercher', icon: Search },
  { to: '/recipes/new', label: 'Ajouter', icon: Plus, center: true },
  { to: '/favorites', label: 'Favoris', icon: Heart },
]

const moreLinks = [
  { to: '/shopping-list', label: 'Liste de courses', icon: ShoppingCart },
  { to: '/meal-planner', label: 'Planificateur', icon: CalendarDays },
  { to: '/pressure-cooker', label: 'Cocotte-minute', icon: Gauge },
]

export function BottomTabBar() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!moreOpen) return
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreOpen])

  if (!isAuthenticated) return null

  const isMoreActive = moreLinks.some((l) => location.pathname.startsWith(l.to))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* More popup */}
      {moreOpen && (
        <div ref={moreRef} className="absolute bottom-full right-2 mb-2 w-52 rounded-xl border border-border bg-card p-2 shadow-xl">
          {moreLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
            >
              <link.icon className="h-4 w-4 text-muted-foreground" />
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <div className="border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-bottom">
        <div className="flex items-end justify-around px-2 pb-1 pt-1">
          {mainTabs.map((tab) => {
            const isActive = tab.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.to)

            if (tab.center) {
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="relative -mt-5 flex flex-col items-center"
                  aria-label={tab.label}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                    <Plus className="h-7 w-7" />
                  </div>
                </Link>
              )
            }

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <tab.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span>{tab.label}</span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
              moreOpen || isMoreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {moreOpen ? (
              <X className="h-5 w-5 stroke-[2.5]" />
            ) : (
              <MoreHorizontal className={cn('h-5 w-5', isMoreActive && 'stroke-[2.5]')} />
            )}
            <span>Plus</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
