import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Search,
  Heart,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ShoppingCart,
  Gauge,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

export function Header() {
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()
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

  const authLinks = [
    { to: '/favorites', label: 'Favoris', icon: Heart },
    { to: '/shopping-list', label: 'Courses', icon: ShoppingCart },
    { to: '/pressure-cooker', label: 'Cocotte', icon: Gauge },
  ]

  // On mobile: hidden when authenticated (BottomTabBar handles nav), visible otherwise
  return (
    <header className={cn(
      'sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60',
      isAuthenticated ? 'hidden md:block' : 'block',
    )}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <BookOpen className="h-6 w-6" />
          <span>Le Grimoire Culinaire</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="flex items-center gap-1">
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
              <Button size="sm" asChild>
                <Link to="/recipes/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Link>
              </Button>
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
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Connexion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Inscription</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
