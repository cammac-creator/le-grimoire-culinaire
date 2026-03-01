import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type EmptyIcon = 'recipes' | 'favorites' | 'search'

interface EmptyStateProps {
  icon: EmptyIcon
  title: string
  description: string
  action?: { label: string; to: string }
}

function RecipesIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="25" y="15" width="70" height="90" rx="6" />
      <line x1="38" y1="35" x2="82" y2="35" />
      <line x1="38" y1="50" x2="72" y2="50" />
      <line x1="38" y1="65" x2="78" y2="65" />
      <line x1="38" y1="80" x2="62" y2="80" />
      <circle cx="85" cy="85" r="18" fill="var(--color-background)" />
      <path d="M85 77v16M77 85h16" strokeWidth="2" />
    </svg>
  )
}

function FavoritesIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M60 100 C20 70 10 40 35 25 C50 18 60 30 60 30 C60 30 70 18 85 25 C110 40 100 70 60 100Z" />
      <path d="M50 55 L55 60 L70 45" strokeWidth="2" />
    </svg>
  )
}

function SearchIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="52" cy="52" r="28" />
      <line x1="72" y1="72" x2="100" y2="100" strokeWidth="3" />
      <line x1="40" y1="45" x2="64" y2="45" />
      <line x1="40" y1="55" x2="58" y2="55" />
    </svg>
  )
}

const illustrations: Record<EmptyIcon, () => React.ReactNode> = {
  recipes: RecipesIllustration,
  favorites: FavoritesIllustration,
  search: SearchIllustration,
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Illustration = illustrations[icon]

  return (
    <div className="rounded-lg border border-dashed border-border p-8 sm:p-12 text-center">
      <Illustration />
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
      {action && (
        <Button className="mt-4" asChild>
          <Link to={action.to}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}
