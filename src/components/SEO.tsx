import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  recipe?: {
    title: string
    description?: string | null
    ingredients?: { name: string }[]
    category?: string
    prep_time?: number | null
    cook_time?: number | null
    servings?: number | null
    author_name?: string | null
  }
}

const SITE_NAME = 'Le Grimoire Culinaire'
const DEFAULT_DESCRIPTION = 'Numérisez vos recettes manuscrites, organisez votre collection et composez votre propre livre de cuisine.'

export function SEO({ title, description, image, url, type = 'website', recipe }: SEOProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  const desc = description || DEFAULT_DESCRIPTION

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}

      {recipe && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: recipe.title,
            description: recipe.description || undefined,
            recipeCategory: recipe.category,
            recipeIngredient: recipe.ingredients?.map((i) => i.name),
            prepTime: recipe.prep_time ? `PT${recipe.prep_time}M` : undefined,
            cookTime: recipe.cook_time ? `PT${recipe.cook_time}M` : undefined,
            recipeYield: recipe.servings ? `${recipe.servings} portions` : undefined,
            author: recipe.author_name ? { '@type': 'Person', name: recipe.author_name } : undefined,
          })}
        </script>
      )}
    </Helmet>
  )
}
