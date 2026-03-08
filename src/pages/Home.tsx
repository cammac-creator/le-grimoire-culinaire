import { Link } from 'react-router-dom'
import { Search, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SEO } from '@/components/SEO'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { CategoryCarousel } from '@/components/recipe/CategoryCarousel'
import { EmptyState } from '@/components/EmptyState'
import { useInfiniteMyRecipes } from '@/hooks/useInfiniteRecipes'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const myRecipes = useInfiniteMyRecipes(user?.id)

  const myList = myRecipes.data?.pages.flat() ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <SEO description="Numérisez vos recettes manuscrites, organisez votre collection et composez votre propre livre de cuisine." />
      {/* Hero */}
      <section className="mb-8 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
          Le Grimoire Culinaire
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          Numérisez vos recettes manuscrites, organisez votre collection
          et composez votre propre livre de cuisine.
        </p>
        {!isAuthenticated && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
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
          </div>
        )}
      </section>

      {/* Carousel categories — uniquement pour les utilisateurs connectés */}
      {isAuthenticated && <CategoryCarousel />}

      {/* Recettes */}
      <section>
        {isAuthenticated ? (
          <>
            {myList.length > 0 || myRecipes.isLoading ? (
              <RecipeGrid
                recipes={myList}
                isLoading={myRecipes.isLoading}
                isFetchingNextPage={myRecipes.isFetchingNextPage}
                hasNextPage={myRecipes.hasNextPage ?? false}
                fetchNextPage={myRecipes.fetchNextPage}
              />
            ) : (
              <EmptyState
                icon="recipes"
                title="Vous n'avez pas encore de recettes"
                description="Ajoutez votre premiere recette pour commencer votre grimoire !"
                action={{ label: 'Ajouter une recette', to: '/recipes/new' }}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Connectez-vous pour accéder à vos recettes.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
