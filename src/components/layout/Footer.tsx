import { Link } from 'react-router-dom'
import { BookOpen, Download, FileJson, FileText, BookMarked, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useInfiniteMyRecipes } from '@/hooks/useInfiniteRecipes'
import { exportAsJson, exportAsPdf } from '@/lib/recipe-export'

export function Footer() {
  const { user, isAuthenticated } = useAuth()
  const myRecipes = useInfiniteMyRecipes(user?.id)
  const myList = myRecipes.data?.pages.flat() ?? []

  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto max-w-7xl px-4">
        {isAuthenticated && myList.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter mes recettes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportAsJson(myList)}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Exporter en JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsPdf(myList)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exporter en PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" asChild>
              <Link to="/book-builder">
                <BookMarked className="mr-2 h-4 w-4" />
                Composer un livre
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/font-creator">
                <PenTool className="mr-2 h-4 w-4" />
                Créer ma police
              </Link>
            </Button>
          </div>
        )}
        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Le Grimoire Culinaire</span>
          </div>
          <p className="mt-2">
            Numérisez, organisez et partagez vos recettes.
          </p>
        </div>
      </div>
    </footer>
  )
}
