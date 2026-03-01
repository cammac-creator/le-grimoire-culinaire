import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Search,
  Heart,
  LogOut,
  User,
  Camera,
  FileStack,
  Menu,
  X,
  PenTool,
  ShoppingCart,
  Link2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navLinks = [
    { to: '/', label: 'Grimoire', icon: BookOpen },
    { to: '/search', label: 'Rechercher', icon: Search },
  ]

  const authLinks = [
    { to: '/recipes/new', label: 'Nouvelle recette', icon: Plus },
    { to: '/ocr', label: 'Scanner (OCR)', icon: Camera },
    { to: '/import', label: 'Import PDF', icon: FileStack },
    { to: '/my-recipes', label: 'Mes recettes', icon: BookOpen },
    { to: '/favorites', label: 'Favoris', icon: Heart },
    { to: '/font-creator', label: 'Polices', icon: PenTool },
    { to: '/shopping-list', label: 'Courses', icon: ShoppingCart },
    { to: '/import-url', label: 'Import URL', icon: Link2 },
  ]

  return (
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
                <DropdownMenuItem onClick={() => navigate('/my-recipes')}>
                  <User className="mr-2 h-4 w-4" />
                  Mes recettes
                </DropdownMenuItem>
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
                <DropdownMenuItem onClick={() => navigate('/import-url')}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Import URL
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
            {isAuthenticated &&
              authLinks.map((link) => (
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
  )
}
