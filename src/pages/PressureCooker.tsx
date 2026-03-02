import { useState, useMemo } from 'react'
import { Search, Timer, Droplets, Gauge, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SEO } from '@/components/SEO'
import { cn } from '@/lib/utils'
import {
  PRESSURE_COOKER_DATA,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type PressureCookerCategory,
  type PressureCookerItem,
} from '@/lib/pressure-cooker-data'
import { useTimer } from '@/hooks/useTimer'
import { TimerWidget } from '@/components/timer/TimerWidget'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as PressureCookerCategory[]

function ItemCard({ item, onStartTimer }: { item: PressureCookerItem; onStartTimer: (item: PressureCookerItem) => void }) {
  // Barre de temps proportionnelle (max 45 min dans les données)
  const barWidth = Math.min(100, (item.minutes / 45) * 100)

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight">{item.name}</h3>

            {/* Barre de temps visuelle */}
            <div className="mt-2 flex items-center gap-2">
              <div className="relative h-6 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full transition-all',
                    item.minutes <= 5 && 'bg-green-500',
                    item.minutes > 5 && item.minutes <= 15 && 'bg-amber-500',
                    item.minutes > 15 && item.minutes <= 30 && 'bg-orange-500',
                    item.minutes > 30 && 'bg-red-500',
                  )}
                  style={{ width: `${barWidth}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">
                  {item.minutes} min
                </span>
              </div>
            </div>

            {/* Détails */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Niveau {item.level}
              </span>
              <span className="inline-flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {item.liquid}
              </span>
            </div>

            {item.note && (
              <p className="mt-1.5 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                {item.note}
              </p>
            )}
          </div>

          {/* Bouton minuteur */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => onStartTimer(item)}
            aria-label={`Lancer un minuteur de ${item.minutes} minutes pour ${item.name}`}
          >
            <Timer className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PressureCookerPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PressureCookerCategory | null>(null)
  const { timers, addTimer, startTimer, pauseTimer, resetTimer, removeTimer, stopAlarm } = useTimer()

  const filtered = useMemo(() => {
    let items = PRESSURE_COOKER_DATA
    if (selectedCategory) {
      items = items.filter((i) => i.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      items = items.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        CATEGORY_LABELS[i.category].toLowerCase().includes(q),
      )
    }
    return items
  }, [search, selectedCategory])

  // Grouper par catégorie
  const grouped = useMemo(() => {
    const groups = new Map<PressureCookerCategory, PressureCookerItem[]>()
    for (const item of filtered) {
      const list = groups.get(item.category) ?? []
      list.push(item)
      groups.set(item.category, list)
    }
    return groups
  }, [filtered])

  const handleStartTimer = (item: PressureCookerItem) => {
    const id = `pc-${item.name}`
    addTimer(id, `${item.name} (cocotte)`, item.minutes * 60)
    startTimer(id)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SEO title="Cocotte pression — Temps de cuisson" description="Guide des temps de cuisson pour cocotte-minute Duromatic" />

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Cocotte pression</h1>
        <p className="mt-1 text-muted-foreground">
          Temps de cuisson Duromatic — Appuyez sur <Timer className="inline h-4 w-4" /> pour lancer un minuteur
        </p>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un aliment..."
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Filtres catégories */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="rounded-full"
        >
          Tout
        </Button>
        {ALL_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className="rounded-full"
          >
            <span className="mr-1">{CATEGORY_ICONS[cat]}</span>
            {CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      {/* Légende couleurs */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Rapide (≤5 min)</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Moyen (6-15 min)</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Long (16-30 min)</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Très long (30+ min)</span>
      </div>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg">Aucun résultat</p>
          <p className="text-sm mt-1">Essayez un autre terme de recherche</p>
        </div>
      ) : (
        <div className="space-y-8">
          {ALL_CATEGORIES.filter((cat) => grouped.has(cat)).map((cat) => (
            <section key={cat}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span>{CATEGORY_ICONS[cat]}</span>
                {CATEGORY_LABELS[cat]}
                <span className="text-sm font-normal text-muted-foreground">({grouped.get(cat)!.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {grouped.get(cat)!.map((item) => (
                  <ItemCard key={item.name} item={item} onStartTimer={handleStartTimer} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Info source */}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        Source : Kuhn Rikon Duromatic — Les temps peuvent varier selon le produit et sa qualité.
        <br />
        Les légumes secs doivent être salés après cuisson uniquement.
      </p>

      {/* Minuteurs */}
      <TimerWidget
        timers={timers}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
        onRemove={removeTimer}
        onStopAlarm={stopAlarm}
      />
    </div>
  )
}
