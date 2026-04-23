import { useState } from 'react'
import { ShoppingCart, Trash2, Printer, X, Plus, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useShoppingList } from '@/hooks/useShoppingList'
import { useLocale } from '@/hooks/useLocale'

export default function ShoppingList() {
  const {
    recipes,
    items,
    clearList,
    toggleItem,
    removeRecipe,
    addManualItem,
    removeItem,
  } = useShoppingList()
  const { t } = useLocale()
  const [manualName, setManualName] = useState('')
  const [copied, setCopied] = useState(false)

  const checkedCount = items.filter((i) => i.checked).length

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualName.trim()) return
    addManualItem(manualName)
    setManualName('')
  }

  const handleCopy = async () => {
    const text = items
      .filter((i) => !i.checked)
      .map((i) => {
        const qty = i.quantity ? `${i.quantity} ${i.unit}`.trim() : ''
        return qty ? `- ${qty} ${i.name}` : `- ${i.name}`
      })
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard non disponible (Safari iOS sans HTTPS, etc.)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('shop.title')}</h1>
        <div className="flex flex-wrap gap-2">
          {items.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </Button>
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
              <button
                onClick={() => removeRecipe(r.id)}
                className="hover:text-destructive"
                aria-label={`Retirer ${r.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Card className="mb-4">
        <CardContent className="p-3">
          <form onSubmit={handleAddManual} className="flex gap-2">
            <Input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder={t('shop.addManualPlaceholder')}
              className="flex-1"
              aria-label={t('shop.addManualPlaceholder')}
            />
            <Button type="submit" size="sm" disabled={!manualName.trim()}>
              <Plus className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">{t('common.add')}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

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
                <li key={i} className="flex items-center gap-3 group">
                  <input
                    type="checkbox"
                    id={`item-${i}`}
                    checked={item.checked}
                    onChange={() => toggleItem(i)}
                    className="h-4 w-4 rounded border-border shrink-0"
                  />
                  <label
                    htmlFor={`item-${i}`}
                    className={`flex-1 cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {item.quantity && (
                      <span className="font-medium">
                        {item.quantity} {item.unit}{' '}
                      </span>
                    )}
                    {item.name}
                    {item.sourceRecipes.includes('__manual__') && (
                      <span className="ml-2 text-xs text-muted-foreground italic">
                        · {t('shop.addedManually')}
                      </span>
                    )}
                  </label>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    aria-label={`Retirer ${item.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
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
