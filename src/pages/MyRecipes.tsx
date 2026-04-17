import { Link } from 'react-router-dom'
import { BookOpen, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { useInfiniteMyRecipes } from '@/hooks/useInfiniteRecipes'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { exportAsJson, exportAsPdf } from '@/lib/recipe-export'

export default function MyRecipes() {
  const { user } = useAuth()
  const { t } = useLocale()
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteMyRecipes(user?.id)
  const recipes = data?.pages.flat() ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('mine.title')}</h1>
        <div className="flex gap-2">
          {recipes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {t('mine.export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportAsJson(recipes)}>
                  {t('mine.exportJson')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsPdf(recipes)}>
                  {t('mine.exportPdf')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

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
          <h3 className="mt-4 text-lg font-medium">{t('mine.empty')}</h3>
          <p className="mt-2 text-muted-foreground">{t('mine.emptyDesc')}</p>
          <Button className="mt-4" asChild>
            <Link to="/recipes/new">{t('mine.addRecipe')}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
