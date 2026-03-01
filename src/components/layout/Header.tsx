import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Search,
  Heart,
  LogOut,
  Camera,
  FileStack,
  Menu,
  X,
  PenTool,
  ShoppingCart,
  Link2,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  CalendarDays,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { supabase } from '@/lib/supabase'
import { RECIPE_SELECT } from '@/lib/queries'
import type { Recipe } from '@/types'

export function Header() {
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navLinks = [
    { to: '/', label: 'Grimoire', icon: BookOpen },
    { to: '/search', label: 'Rechercher', icon: Search },
  ]

  const addLinks = [
    { to: '/recipes/new', label: 'Nouvelle recette', icon: Plus },
    { to: '/ocr', label: 'Scanner (OCR)', icon: Camera },
    { to: '/import', label: 'Import PDF', icon: FileStack },
    { to: '/import-url', label: 'Import URL', icon: Link2 },
  ]

  const authLinks = [
    { to: '/favorites', label: 'Favoris', icon: Heart },
    { to: '/shopping-list', label: 'Courses', icon: ShoppingCart },
    { to: '/meal-planner', label: 'Repas', icon: CalendarDays },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <BookOpen className="h-6 w-6" />
            <span className="hidden sm:inline">Le Grimoire Culinaire</span>
            <span className="sm:hidden">Grimoire</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button key={link.to} variant="ghost" size="sm" asChild>
                <Link to={link.to} className="flex items-center gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}

            {isAuthenticated && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Ajouter
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {addLinks.map((link) => (
                      <DropdownMenuItem key={link.to} onClick={() => navigate(link.to)}>
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {authLinks.map((link) => (
                  <Button key={link.to} variant="ghost" size="sm" asChild>
                    <Link to={link.to} className="flex items-center gap-2">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </>
            )}
          </nav>

          {/* User menu or Login */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Recherche rapide"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={`Thème : ${theme === 'dark' ? 'sombre' : theme === 'light' ? 'clair' : 'système'}`}
            >
              <ThemeIcon className="h-4 w-4" />
            </Button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {(profile?.username ?? user?.email ?? '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {profile?.username ?? user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="mr-2 h-4 w-4" />
                    Favoris
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/book-builder')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Livre
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/font-creator')}>
                    <PenTool className="mr-2 h-4 w-4" />
                    Polices
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/shopping-list')}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Courses
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden gap-2 md:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Inscription</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="border-t border-border bg-card p-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Button
                  key={link.to}
                  variant="ghost"
                  className="justify-start"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link to={link.to} className="flex items-center gap-2">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              ))}
              {isAuthenticated && (
                <>
                  <div className="mt-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Ajouter</div>
                  {addLinks.map((link) => (
                    <Button
                      key={link.to}
                      variant="ghost"
                      className="justify-start"
                      asChild
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link to={link.to} className="flex items-center gap-2">
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                  <div className="mt-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Collection</div>
                  {authLinks.map((link) => (
                    <Button
                      key={link.to}
                      variant="ghost"
                      className="justify-start"
                      asChild
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link to={link.to} className="flex items-center gap-2">
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                </>
              )}
              {!isAuthenticated && (
                <>
                  <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/login">Connexion</Link>
                  </Button>
                  <Button className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/register">Inscription</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}

function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Recipe[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    const { data: ranked } = await supabase.rpc('search_recipe_ids', {
      query_text: q,
      category_filter: null,
      tags_filter: null,
      is_tested_filter: null,
      user_id_filter: null,
      p_favorites_only: false,
      p_limit: 5,
      p_offset: 0,
      dietary_filter: null,
    })
    if (!ranked || ranked.length === 0) { setResults([]); return }
    const ids = ranked.map((r: { recipe_id: string }) => r.recipe_id)
    const { data } = await supabase.from('recipes').select(RECIPE_SELECT).in('id', ids)
    if (data) {
      const map = new Map((data as Recipe[]).map((r) => [r.id, r]))
      setResults(ids.map((id: string) => map.get(id)).filter(Boolean) as Recipe[])
    }
  }, [])

  const handleChange = useCallback((value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(value), 300)
  }, [search])

  const goTo = useCallback((id: string) => {
    onOpenChange(false)
    navigate(`/recipes/${id}`)
  }, [navigate, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] translate-y-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Recherche rapide</DialogTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Rechercher une recette..."
            className="pl-10"
            aria-label="Recherche rapide"
          />
        </div>
        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => goTo(r.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
                >
                  <span className="text-2xl">🍽️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.category}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.length >= 2 && results.length === 0 && (
          <p className="mt-2 text-center text-sm text-muted-foreground">Aucun resultat</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
