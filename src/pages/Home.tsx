import { Link } from 'react-router-dom'
import { Plus, Camera, Search, Download, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SEO } from '@/components/SEO'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { CategoryCarousel } from '@/components/recipe/CategoryCarousel'
import { EmptyState } from '@/components/EmptyState'
import { useInfiniteRecipes, useInfiniteMyRecipes } from '@/hooks/useInfiniteRecipes'
import { useAuth } from '@/hooks/useAuth'
import { exportAsJson, exportAsPdf } from '@/lib/recipe-export'

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const allRecipes = useInfiniteRecipes()
  const myRecipes = useInfiniteMyRecipes(user?.id)

  const allList = allRecipes.data?.pages.flat() ?? []
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
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

      {/* Carousel categories */}
      <CategoryCarousel />

      {/* Recettes */}
      <section>
        {isAuthenticated ? (
          <Tabs defaultValue="all">
            <div className="mb-6 flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="mine">Mes recettes</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all">
              {allList.length > 0 || allRecipes.isLoading ? (
                <RecipeGrid
                  recipes={allList}
                  isLoading={allRecipes.isLoading}
                  isFetchingNextPage={allRecipes.isFetchingNextPage}
                  hasNextPage={allRecipes.hasNextPage ?? false}
                  fetchNextPage={allRecipes.fetchNextPage}
                />
              ) : (
                <EmptyState
                  icon="recipes"
                  title="Aucune recette pour le moment"
                  description="Commencez par ajouter votre premiere recette !"
                  action={isAuthenticated ? { label: 'Ajouter une recette', to: '/recipes/new' } : undefined}
                />
              )}
            </TabsContent>

            <TabsContent value="mine">
              {myList.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => exportAsJson(myList)}>
                        Exporter en JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportAsPdf(myList)}>
                        Exporter en PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
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
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <h2 className="mb-6 text-2xl font-semibold">Dernieres recettes</h2>
            {allList.length > 0 || allRecipes.isLoading ? (
              <RecipeGrid
                recipes={allList}
                isLoading={allRecipes.isLoading}
                isFetchingNextPage={allRecipes.isFetchingNextPage}
                hasNextPage={allRecipes.hasNextPage ?? false}
                fetchNextPage={allRecipes.fetchNextPage}
              />
            ) : (
              <EmptyState
                icon="recipes"
                title="Aucune recette pour le moment"
                description="Commencez par ajouter votre premiere recette !"
              />
            )}
          </>
        )}
      </section>
    </div>
  )
}
