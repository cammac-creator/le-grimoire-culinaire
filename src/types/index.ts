export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  ingredients: Ingredient[]
  steps: Step[]
  author_name: string | null
  author_date: string | null
  category: RecipeCategory
  tags: string[]
  servings: number | null
  prep_time: number | null
  cook_time: number | null
  is_tested: boolean
  tested_at: string | null
  tested_notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  profile?: Profile
  images?: RecipeImage[]
  likes_count?: number
  user_has_liked?: boolean
}

export interface Ingredient {
  name: string
  quantity: string
  unit: string
}

export interface Step {
  number: number
  text: string
  image_url?: string
}

export const RECIPE_CATEGORY_VALUES = [
  'entree',
  'plat',
  'dessert',
  'boisson',
  'sauce',
  'accompagnement',
  'pain',
  'autre',
] as const

export type RecipeCategory = (typeof RECIPE_CATEGORY_VALUES)[number]

export const RECIPE_CATEGORIES: { value: RecipeCategory; label: string }[] = [
  { value: 'entree', label: 'Entrée' },
  { value: 'plat', label: 'Plat' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'boisson', label: 'Boisson' },
  { value: 'sauce', label: 'Sauce' },
  { value: 'accompagnement', label: 'Accompagnement' },
  { value: 'pain', label: 'Pain' },
  { value: 'autre', label: 'Autre' },
]

export const IMAGE_TYPES = ['source', 'step', 'result'] as const
export type ImageType = (typeof IMAGE_TYPES)[number]

export const STORAGE_BUCKETS = {
  sources: 'recipe-sources',
  photos: 'recipe-photos',
} as const

export interface RecipeImage {
  id: string
  recipe_id: string
  storage_path: string
  type: ImageType
  step_number: number | null
  position: number
  created_at: string
  url?: string
}

export interface Like {
  id: string
  user_id: string
  recipe_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  recipe_id: string
  content: string
  created_at: string
  profile?: Profile
}

export interface OcrResult {
  title: string
  ingredients: Ingredient[]
  steps: Step[]
  servings: number | null
  prep_time: number | null
  cook_time: number | null
  category: RecipeCategory
  author_name: string | null
}

export interface SearchFilters {
  query: string
  category: RecipeCategory | ''
  tags: string[]
  is_tested: boolean | null
  favorites_only: boolean
}
