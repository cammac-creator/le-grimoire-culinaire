import { useState, useMemo, useRef, useCallback } from 'react'
import { Search, Timer, Droplets, Gauge, Info, ArrowUpDown, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { IOSShortcutPrompt } from '@/components/timer/IOSShortcutPrompt'
import { useIOSTimer } from '@/hooks/useIOSTimer'
import { toast } from '@/hooks/useToast'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as PressureCookerCategory[]

type SortMode = 'category' | 'time-asc' | 'time-desc' | 'alpha'
const SORT_LABELS: Record<SortMode, string> = {
  category: 'Par catégorie',
  'time-asc': 'Plus rapide d\'abord',
  'time-desc': 'Plus long d\'abord',
  alpha: 'A → Z',
}

function TimeDisplay({ minutes }: { minutes: number }) {
  const color = minutes <= 5
    ? 'text-green-600 dark:text-green-400'
    : minutes <= 15
      ? 'text-amber-600 dark:text-amber-400'
      : minutes <= 30
        ? 'text-orange-600 dark:text-orange-400'
        : 'text-red-600 dark:text-red-400'

  const bgColor = minutes <= 5
    ? 'bg-green-100 dark:bg-green-950/40'
    : minutes <= 15
      ? 'bg-amber-100 dark:bg-amber-950/40'
      : minutes <= 30
        ? 'bg-orange-100 dark:bg-orange-950/40'
        : 'bg-red-100 dark:bg-red-950/40'

  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[4.5rem]', bgColor)}>
      <span className={cn('text-2xl font-bold tabular-nums leading-none', color)}>
        {minutes}
      </span>
      <span className="text-[10px] font-medium text-muted-foreground mt-0.5">min</span>
    </div>
  )
}

function ItemRow({ item, onStartTimer, isTimerActive }: {
  item: PressureCookerItem
  onStartTimer: (item: PressureCookerItem) => void
  isTimerActive: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card p-3 transition-all',
        'active:scale-[0.99]',
        isTimerActive && 'ring-2 ring-primary/50 border-primary/30',
      )}
    >
      {/* Temps — gros et coloré */}
      <TimeDisplay minutes={item.minutes} />

      {/* Infos */}
      <button
        className="flex-1 min-w-0 text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="font-semibold leading-tight">{item.name}</div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Gauge className="h-3 w-3" />
            Niv. {item.level}
          </span>
          {!expanded && item.note && (
            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
              <Info className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Détails expansibles */}
        {expanded && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <Droplets className="h-3 w-3 shrink-0" />
              {item.liquid}
            </p>
            {item.note && (
              <p className="flex items-start gap-1 text-amber-700 dark:text-amber-400">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                {item.note}
              </p>
            )}
          </div>
        )}
      </button>

      {/* Bouton minuteur — gros et tactile */}
      <Button
        variant={isTimerActive ? 'default' : 'outline'}
        size="icon"
        className={cn('h-12 w-12 shrink-0 rounded-xl', isTimerActive && 'pointer-events-none')}
        onClick={() => onStartTimer(item)}
        disabled={isTimerActive}
        aria-label={isTimerActive ? 'Minuteur en cours' : `${item.minutes} min — lancer le minuteur`}
      >
        {isTimerActive ? (
          <Check className="h-5 w-5" />
        ) : (
          <Timer className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}

export default function PressureCookerPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PressureCookerCategory | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('category')
  const [showSort, setShowSort] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const { timers, addTimer, startTimer, pauseTimer, resetTimer, removeTimer, stopAlarm } = useTimer()
  const iosTimer = useIOSTimer()

  const activeTimerIds = useMemo(
    () => new Set(timers.map((t) => t.id)),
    [timers],
  )

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
    // Tri
    if (sortMode === 'time-asc') {
      items = [...items].sort((a, b) => a.minutes - b.minutes)
    } else if (sortMode === 'time-desc') {
      items = [...items].sort((a, b) => b.minutes - a.minutes)
    } else if (sortMode === 'alpha') {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }
    return items
  }, [search, selectedCategory, sortMode])

  // Grouper par catégorie (seulement en mode catégorie)
  const grouped = useMemo(() => {
    if (sortMode !== 'category') return null
    const groups = new Map<PressureCookerCategory, PressureCookerItem[]>()
    for (const item of filtered) {
      const list = groups.get(item.category) ?? []
      list.push(item)
      groups.set(item.category, list)
    }
    return groups
  }, [filtered, sortMode])

  // Compteurs par catégorie (pour les badges)
  const categoryCounts = useMemo(() => {
    const base = search.trim()
      ? PRESSURE_COOKER_DATA.filter((i) => {
          const q = search.toLowerCase().trim()
          return i.name.toLowerCase().includes(q) || CATEGORY_LABELS[i.category].toLowerCase().includes(q)
        })
      : PRESSURE_COOKER_DATA
    const counts = new Map<PressureCookerCategory, number>()
    for (const item of base) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    }
    return counts
  }, [search])

  const handleStartTimer = useCallback((item: PressureCookerItem) => {
    const id = `pc-${item.name}`
    if (activeTimerIds.has(id)) return
    const seconds = item.minutes * 60
    // Tenter le minuteur natif iOS en priorite
    if (iosTimer.tryIOSTimer(seconds)) return
    // Fallback : timer web
    addTimer(id, `${item.name} (cocotte)`, seconds)
    startTimer(id)
    toast({ title: `Minuteur lancé : ${item.minutes} min`, description: item.name })
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [activeTimerIds, addTimer, startTimer, iosTimer])

  const clearSearch = () => {
    setSearch('')
    searchRef.current?.focus()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32">
      <SEO title="Cocotte pression — Temps de cuisson" description="Guide des temps de cuisson pour cocotte-minute Duromatic" />

      {/* En-tête */}
      <div className="py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Cocotte pression</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Temps de cuisson Duromatic — Touchez un aliment pour plus de détails
        </p>
      </div>

      {/* Barre sticky : recherche + tri */}
      <div className="sticky top-16 z-30 -mx-4 bg-background/95 backdrop-blur px-4 pb-3 pt-2 border-b border-transparent [&:not(:first-child)]:border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un aliment..."
              className="pl-10 pr-8 h-11 text-base rounded-xl"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl shrink-0"
              onClick={() => setShowSort(!showSort)}
              aria-label="Trier"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border bg-card p-1 shadow-lg">
                  {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setSortMode(mode); setShowSort(false) }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                        sortMode === mode ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
                      )}
                    >
                      {sortMode === mode && <Check className="h-3.5 w-3.5" />}
                      <span className={sortMode !== mode ? 'ml-5.5' : ''}>{SORT_LABELS[mode]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filtres catégories — scroll horizontal */}
        <div className="-mx-4 mt-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 px-4 pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              Tout ({PRESSURE_COOKER_DATA.length})
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const count = categoryCounts.get(cat) ?? 0
              if (count === 0 && search.trim()) return null
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                  {search.trim() && <span className="ml-1 opacity-70">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Compteur de résultats */}
      <div className="mt-4 mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} aliment{filtered.length > 1 ? 's' : ''}</span>
        {timers.length > 0 && (
          <span className="flex items-center gap-1 text-primary font-medium">
            <Timer className="h-3 w-3" />
            {timers.length} minuteur{timers.length > 1 ? 's' : ''} actif{timers.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-lg font-medium">Aucun résultat</p>
          <p className="text-sm text-muted-foreground mt-1">Essayez un autre terme de recherche</p>
          {search && (
            <Button variant="outline" className="mt-4 rounded-full" onClick={clearSearch}>
              Effacer la recherche
            </Button>
          )}
        </div>
      ) : grouped ? (
        // Mode catégorie
        <div className="space-y-6 mt-2">
          {ALL_CATEGORIES.filter((cat) => grouped.has(cat)).map((cat) => (
            <section key={cat}>
              <h2 className="sticky top-[8.5rem] z-20 -mx-4 bg-background/95 backdrop-blur px-4 py-2 flex items-center gap-2 text-base font-bold border-b border-border/50">
                <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                {CATEGORY_LABELS[cat]}
                <span className="text-xs font-normal text-muted-foreground">({grouped.get(cat)!.length})</span>
              </h2>
              <div className="mt-2 space-y-2">
                {grouped.get(cat)!.map((item) => (
                  <ItemRow
                    key={item.name}
                    item={item}
                    onStartTimer={handleStartTimer}
                    isTimerActive={activeTimerIds.has(`pc-${item.name}`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        // Mode tri plat
        <div className="mt-2 space-y-2">
          {filtered.map((item) => (
            <ItemRow
              key={item.name}
              item={item}
              onStartTimer={handleStartTimer}
              isTimerActive={activeTimerIds.has(`pc-${item.name}`)}
            />
          ))}
        </div>
      )}

      {/* Info source */}
      <div className="mt-10 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Astuces cocotte pression</p>
        <p>Les légumes secs doivent être salés uniquement après cuisson.</p>
        <p>Les pommes de terre primeurs nécessitent jusqu'à ⅓ de temps en moins.</p>
        <p>Les temps peuvent varier selon la qualité et le stockage des aliments.</p>
        <p className="pt-1 opacity-60">Source : Kuhn Rikon Duromatic</p>
      </div>

      <IOSShortcutPrompt
        open={iosTimer.showPrompt}
        onOpenChange={iosTimer.setShowPrompt}
        onConfirm={iosTimer.confirmAndLaunch}
        onFallback={iosTimer.useFallback}
      />

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
