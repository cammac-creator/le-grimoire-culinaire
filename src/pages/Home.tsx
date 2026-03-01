import { Link } from 'react-router-dom'
import { BookOpen, Plus, Camera, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { useInfiniteRecipes } from '@/hooks/useInfiniteRecipes'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteRecipes()
  const { isAuthenticated } = useAuth()
  const recipes = data?.pages.flat() ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-primary sm:text-5xl">
          Le Grimoire Culinaire
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Numérisez vos recettes manuscrites, organisez votre collection
          et composez votre propre livre de cuisine.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {isAuthenticated ? (
            <>
              <Button asChild>
                <Link to="/recipes/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle recette
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/ocr" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Scanner une recette
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link to="/register" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Commencer
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Explorer
                </Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Dernieres recettes */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold">Dernieres recettes</h2>
        {recipes.length > 0 || isLoading ? (
          <RecipeGrid
            recipes={recipes}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage ?? false}
            fetchNextPage={fetchNextPage}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              Aucune recette pour le moment
            </h3>
            <p className="mt-2 text-muted-foreground">
              Commencez par ajouter votre premiere recette !
            </p>
            {isAuthenticated && (
              <Button className="mt-4" asChild>
                <Link to="/recipes/new">Ajouter une recette</Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
