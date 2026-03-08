import { ShoppingCart, Trash2, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useShoppingList } from '@/hooks/useShoppingList'
import { useLocale } from '@/hooks/useLocale'

export default function ShoppingList() {
  const { recipes, items, clearList, toggleItem, removeRecipe } = useShoppingList()
  const { t } = useLocale()

  const checkedCount = items.filter((i) => i.checked).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('shop.title')}</h1>
        <div className="flex gap-2">
          {items.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1 h-4 w-4" />
                {t('shop.print')}
              </Button>
              <Button variant="outline" size="sm" onClick={clearList}>
                <Trash2 className="mr-1 h-4 w-4" />
                {t('shop.clear')}
              </Button>
            </>
          )}
        </div>
      </div>

      {recipes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {recipes.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
            >
              {r.title}
              <button onClick={() => removeRecipe(r.id)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('shop.ingredients')}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {checkedCount}/{items.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`item-${i}`}
                    checked={item.checked}
                    onChange={() => toggleItem(i)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor={`item-${i}`} className={item.checked ? 'line-through text-muted-foreground' : ''}>
                    {item.quantity && <span className="font-medium">{item.quantity} {item.unit} </span>}
                    {item.name}
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('shop.empty')}</h3>
          <p className="mt-2 text-muted-foreground">
            {t('shop.emptyDesc')}
          </p>
        </div>
      )}
    </div>
  )
}
