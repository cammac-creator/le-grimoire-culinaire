import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const EXTRACTION_PROMPT = `Tu recois le contenu HTML nettoye d'une page web de recette de cuisine.
Extrais les informations structurees de cette recette.

Reponds UNIQUEMENT avec le JSON suivant :

{
  "title": "Titre de la recette",
  "ingredients": [
    { "name": "nom", "quantity": "quantite", "unit": "unite" }
  ],
  "steps": [
    { "number": 1, "text": "Description de l'etape" }
  ],
  "servings": nombre_ou_null,
  "prep_time": minutes_ou_null,
  "cook_time": minutes_ou_null,
  "category": "entree|plat|dessert|boisson|sauce|accompagnement|pain|autre",
  "author_name": "auteur_ou_null"
}

REGLES :
- Chaque ingredient doit avoir name, quantity, unit separes
- Les etapes doivent etre numerotees sequentiellement
- prep_time et cook_time en minutes
- category en minuscules sans accent
- Si une info n'est pas trouvee, utilise null
- Reponds UNIQUEMENT avec le JSON`

/** Extract the main image URL from raw HTML (og:image, JSON-LD, or first large img). */
function extractImageUrl(html: string): string | null {
  // 1. og:image meta tag (most reliable for recipe sites)
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  if (ogMatch?.[1]) return ogMatch[1]

  // 2. JSON-LD structured data
  const ldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
  if (ldMatch?.[1]) {
    try {
      const ld = JSON.parse(ldMatch[1])
      const recipe = Array.isArray(ld) ? ld.find((item: { '@type'?: string }) => item['@type'] === 'Recipe') : ld
      const img = recipe?.image
      if (typeof img === 'string') return img
      if (Array.isArray(img) && typeof img[0] === 'string') return img[0]
      if (typeof img?.url === 'string') return img.url
    } catch { /* ignore parse errors */ }
  }

  // 3. twitter:image meta tag
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
  if (twMatch?.[1]) return twMatch[1]

  return null
}

/** Download an image and upload it to Supabase Storage. Returns storage_path or null. */
async function downloadAndStoreImage(imageUrl: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[scrape-recipe] Missing SUPABASE_URL or SERVICE_ROLE_KEY, skipping image upload')
      return null
    }

    console.log(`[scrape-recipe] Downloading image: ${imageUrl.substring(0, 100)}...`)
    const imgResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GrimoireCulinaire/1.0)',
        'Accept': 'image/*',
      },
    })

    if (!imgResponse.ok) {
      console.warn(`[scrape-recipe] Image download failed: HTTP ${imgResponse.status}`)
      return null
    }

    const contentType = imgResponse.headers.get('content-type') ?? 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      console.warn(`[scrape-recipe] Not an image: ${contentType}`)
      return null
    }

    const bytes = new Uint8Array(await imgResponse.arrayBuffer())
    if (bytes.length < 1000) {
      console.warn(`[scrape-recipe] Image too small: ${bytes.length} bytes`)
      return null
    }

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const storagePath = `scraped/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { error: uploadError } = await supabase.storage
      .from('recipe-photos')
      .upload(storagePath, bytes, { contentType, upsert: false })

    if (uploadError) {
      console.warn(`[scrape-recipe] Image upload failed: ${uploadError.message}`)
      return null
    }

    console.log(`[scrape-recipe] Image uploaded: ${storagePath}`)
    return storagePath
  } catch (err) {
    console.warn(`[scrape-recipe] Image processing error: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

function jsonError(message: string, corsHeaders: Record<string, string>, status = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  )
}

function cleanHtml(html: string): string {
  // Remove scripts, styles, nav, header, footer
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 15000)
}

Deno.serve(async (req) => {
  const CORS_HEADERS = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return jsonError('ANTHROPIC_API_KEY non configuree', CORS_HEADERS)
    }

    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return jsonError('URL requise', CORS_HEADERS, 400)
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return jsonError('URL invalide', CORS_HEADERS, 400)
    }

    console.log(`[scrape-recipe] Fetching: ${url}`)

    // Fetch the webpage
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GrimoireCulinaire/1.0)',
        'Accept': 'text/html',
      },
    })

    if (!pageResponse.ok) {
      return jsonError(`Impossible de charger la page (${pageResponse.status})`, CORS_HEADERS, 400)
    }

    const html = await pageResponse.text()

    // Extract image URL from raw HTML before cleaning
    const imageUrl = extractImageUrl(html)
    console.log(`[scrape-recipe] Image URL found: ${imageUrl ? imageUrl.substring(0, 80) + '...' : 'none'}`)

    const cleanedText = cleanHtml(html)

    if (cleanedText.length < 50) {
      return jsonError('Page trop courte ou vide', CORS_HEADERS, 400)
    }

    console.log(`[scrape-recipe] Cleaned text: ${cleanedText.length} chars, sending to Claude...`)

    // Send to Claude for extraction
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\n---\n\nContenu de la page :\n${cleanedText}`,
          },
        ],
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      const errMsg = result.error?.message || 'Erreur API Claude'
      return jsonError(`Claude API: ${errMsg}`, CORS_HEADERS)
    }

    const textContent = result.content?.find((c: { type: string }) => c.type === 'text')?.text
    if (!textContent) {
      return jsonError('Pas de texte dans la reponse Claude', CORS_HEADERS)
    }

    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return jsonError('Impossible de parser le JSON de la reponse', CORS_HEADERS)
    }

    const recipe = JSON.parse(jsonMatch[0])
    console.log(`[scrape-recipe] Success! Recipe: "${recipe.title}"`)

    // Download and store the image (best-effort, don't block on failure)
    let imageStoragePath: string | null = null
    if (imageUrl) {
      imageStoragePath = await downloadAndStoreImage(imageUrl)
    }

    return new Response(JSON.stringify({
      ...recipe,
      ...(imageStoragePath ? { image_storage_path: imageStoragePath } : {}),
    }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('[scrape-recipe] CRASH:', err)
    return jsonError(`Erreur interne: ${err instanceof Error ? err.message : String(err)}`, CORS_HEADERS)
  }
})
