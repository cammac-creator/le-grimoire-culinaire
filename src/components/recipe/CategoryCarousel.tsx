import { Link } from 'react-router-dom'

const categories = [
  { value: 'entree', label: 'Entree', emoji: '🥗' },
  { value: 'plat', label: 'Plat', emoji: '🍲' },
  { value: 'dessert', label: 'Dessert', emoji: '🍰' },
  { value: 'boisson', label: 'Boisson', emoji: '🥤' },
  { value: 'sauce', label: 'Sauce', emoji: '🫙' },
  { value: 'accompagnement', label: 'Accompagnement', emoji: '🥦' },
  { value: 'pain', label: 'Pain', emoji: '🍞' },
  { value: 'autre', label: 'Autre', emoji: '🍽️' },
]

export function CategoryCarousel() {
  return (
    <div className="mb-8 overflow-x-auto scrollbar-hide" role="list" aria-label="Categories">
      <div className="flex gap-3 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {categories.map((cat) => (
          <Link
            key={cat.value}
            to={`/search?category=${cat.value}`}
            className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted"
            style={{ scrollSnapAlign: 'start', minWidth: '100px' }}
            role="listitem"
          >
            <span className="text-3xl">{cat.emoji}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
