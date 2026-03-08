import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Search, Heart, MoreHorizontal, Plus,
  ShoppingCart, Gauge, CalendarDays,
  Sun, Moon, Monitor, LogOut, X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
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
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const themeLabel = theme === 'dark' ? 'Thème sombre' : theme === 'light' ? 'Thème clair' : 'Thème système'

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

  const handleTabClick = (to: string) => {
    if (to === '/' && location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (to === '/search') {
      navigate('/search?focus=1')
      return
    }
    navigate(to)
  }

  const handleSignOut = async () => {
    setMoreOpen(false)
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* More popup */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 bottom-0 z-40 bg-black/30" onClick={() => setMoreOpen(false)} />
          <div
            ref={moreRef}
            className="absolute bottom-full right-3 left-3 z-50 mb-2 rounded-2xl border border-border bg-card p-3 shadow-2xl"
          >
            {/* User info */}
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {(profile?.username ?? user?.email ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.username ?? user?.email}</p>
              </div>
            </div>

            {/* Navigation links */}
            <div className="mb-2 space-y-0.5">
              {moreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-muted active:bg-muted"
                >
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Separator */}
            <div className="my-2 border-t border-border" />

            {/* Settings */}
            <button
              onClick={() => { toggleTheme(); setMoreOpen(false) }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-muted active:bg-muted"
            >
              <ThemeIcon className="h-5 w-5 text-muted-foreground" />
              {themeLabel}
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Se déconnecter
            </button>
          </div>
        </>
      )}

      <div className="border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-bottom">
        <div className="flex items-end justify-around px-4 pb-2 pt-2">
          {mainTabs.map((tab) => {
            const isActive = tab.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.to)

            if (tab.center) {
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="relative -mt-6 flex flex-col items-center"
                  aria-label={tab.label}
                >
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary shadow-lg shadow-primary/30 transition-transform active:scale-95">
                    <Plus className="h-7 w-7 text-white" />
                  </div>
                </Link>
              )
            }

            return (
              <button
                key={tab.to}
                onClick={() => handleTabClick(tab.to)}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-1.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <tab.icon className={cn('h-[22px] w-[22px]', isActive && 'stroke-[2.5]')} />
                <span>{tab.label}</span>
              </button>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-1.5 text-[11px] font-medium transition-colors',
              moreOpen || isMoreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {moreOpen ? (
              <X className="h-[22px] w-[22px] stroke-[2.5]" />
            ) : (
              <MoreHorizontal className={cn('h-[22px] w-[22px]', isMoreActive && 'stroke-[2.5]')} />
            )}
            <span>Plus</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
