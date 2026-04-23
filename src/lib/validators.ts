import { z } from 'zod/v4'
import { RECIPE_CATEGORY_VALUES } from '@/types'

export const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(6, 'Mot de passe : 6 caractères minimum'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.email('Email invalide'),
  username: z.string().min(2, 'Nom : 2 caractères minimum'),
  password: z.string().min(6, 'Mot de passe : 6 caractères minimum'),
})

export type RegisterFormData = z.infer<typeof registerSchema>

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  quantity: z.string(),
  unit: z.string(),
})

const stepSchema = z.object({
  number: z.number(),
  text: z.string().min(1, "Texte de l'étape requis"),
  image_url: z.string().optional(),
})

export const recipeSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200, 'Titre trop long (max 200)'),
  description: z.string().max(2000, 'Description trop longue').optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Au moins un ingrédient').max(100, 'Trop d\'ingrédients (max 100)'),
  steps: z.array(stepSchema).min(1, 'Au moins une étape').max(100, 'Trop d\'étapes (max 100)'),
  author_name: z.string().max(100, 'Nom auteur trop long').optional(),
  author_date: z.string().optional(),
  category: z.enum(RECIPE_CATEGORY_VALUES, { message: 'Catégorie requise' }),
  tags: z.array(z.string()).max(20, 'Trop de tags (max 20)'),
  dietary_tags: z.array(z.string()).default([]),
  servings: z.number().int().min(1, 'Au moins 1 portion').max(100, 'Max 100 portions').nullable(),
  prep_time: z.number().int().min(0, 'Durée >= 0').max(1440, 'Max 24h').nullable(),
  cook_time: z.number().int().min(0, 'Durée >= 0').max(1440, 'Max 24h').nullable(),
  handwriting_font_id: z.string().uuid().nullable().optional(),
})

export type RecipeFormData = z.infer<typeof recipeSchema>
