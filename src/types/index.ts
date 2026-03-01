export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
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
  dietary_tags: string[]
  servings: number | null
  prep_time: number | null
  cook_time: number | null
  is_tested: boolean
  tested_at: string | null
  tested_notes: string | null
  handwriting_font_id: string | null
  nutrition: NutritionInfo | null
  created_at: string
  updated_at: string
  // Joined data
  profile?: Profile
  images?: RecipeImage[]
  likes_count?: number
  user_has_liked?: boolean
  handwriting_font?: HandwritingFont
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
  fonts: 'handwriting-fonts',
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
  /** Storage path of the scraped image (only present when imported from URL). */
  image_storage_path?: string
}

// Polices manuscrites

export const FONT_STATUS_VALUES = ['draft', 'processing', 'ready', 'error'] as const
export type FontStatus = (typeof FONT_STATUS_VALUES)[number]

export interface HandwritingFont {
  id: string
  user_id: string
  author_name: string
  font_name: string
  storage_path: string | null
  character_coverage: Record<string, boolean>
  status: FontStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface FontSourceImage {
  id: string
  font_id: string
  storage_path: string
  extraction_result: CharacterExtractionResult | null
  created_at: string
}

export interface CharacterBoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ExtractedGlyph {
  character: string
  bbox: CharacterBoundingBox
  confidence: number
}

export interface CharacterExtractionResult {
  glyphs: ExtractedGlyph[]
  image_width: number
  image_height: number
}

export const FRENCH_CHARSET = [
  // Minuscules
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  // Majuscules
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  // Chiffres
  ...'0123456789'.split(''),
  // Accents et caractères spéciaux français
  ...'éèêëàâùûôîïçÉÈÊËÀÂÙÛÔÎÏÇ'.split(''),
  // Ponctuation
  ...`.,;:!?'-"()`.split(''),
] as const

export interface Rating {
  id: string
  user_id: string
  recipe_id: string
  score: number
  created_at: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealPlan {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  recipe_id: string
  created_at: string
  recipe?: Recipe
}

export const DIETARY_TAGS = [
  'végétarien',
  'végan',
  'sans gluten',
  'sans lactose',
  'sans noix',
  'halal',
  'casher',
] as const

export interface SearchFilters {
  query: string
  category: RecipeCategory | ''
  tags: string[]
  dietary_tags: string[]
  is_tested: boolean | null
  favorites_only: boolean
}
