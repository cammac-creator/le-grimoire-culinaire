import { BookOpen } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>Le Grimoire Culinaire</span>
        </div>
        <p className="mt-2">
          Numérisez, organisez et partagez vos recettes.
        </p>
      </div>
    </footer>
  )
}
