import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { supabase } from '@/lib/supabase'
import type { Recipe, RecipeImage } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-FR')
}

export function getImageUrl(storagePath: string, bucket: string): string {
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
}

export function getMainImage(recipe: Recipe): RecipeImage | undefined {
  return recipe.images?.find((img) => img.type === 'result') ??
    recipe.images?.find((img) => img.type === 'source')
}

export function getInitial(name?: string | null, fallback = '?'): string {
  return name?.charAt(0).toUpperCase() ?? fallback
}
