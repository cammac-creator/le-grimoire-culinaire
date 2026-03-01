import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'extraction de recettes de cuisine à partir de photos.
Analyse l'image fournie (recette manuscrite ou découpée dans un magazine) et extrais les informations suivantes au format JSON :

{
  "title": "Titre de la recette",
  "ingredients": [
    { "name": "nom de l'ingrédient", "quantity": "quantité", "unit": "unité" }
  ],
  "steps": [
    { "number": 1, "text": "Description de l'étape" }
  ],
  "servings": nombre_de_portions_ou_null,
  "prep_time": temps_preparation_en_minutes_ou_null,
  "cook_time": temps_cuisson_en_minutes_ou_null,
  "category": "entree|plat|dessert|boisson|sauce|accompagnement|pain|autre",
  "author_name": "auteur_si_visible_ou_null"
}

Règles :
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- Si tu ne peux pas lire certaines parties, fais de ton mieux pour deviner
- Les quantités doivent être séparées de l'unité (ex: "200" et "g")
- Les étapes doivent être numérotées à partir de 1
- Choisis la catégorie la plus appropriée
- Si l'écriture est difficile à lire, indique [illisible] dans le texte

Attention particulière pour les chiffres manuscrits :
- Distingue bien "1" et "4" : un "1" manuscrit est un simple trait vertical (parfois avec un petit empattement), tandis qu'un "4" a un angle ou un trait horizontal
- Distingue "11" de "4" ou "H" : deux traits verticaux côte à côte = 11
- Vérifie la cohérence des quantités (ex: "4 dl" de crème est plausible, "11 dl" serait suspect pour une recette standard)
- En cas de doute sur un chiffre, privilégie la valeur la plus réaliste pour une recette de cuisine`

const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonError(message: string, status = 500) {
  console.error(`[ocr-recipe] ERROR: ${message}`)
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  )
}

// Efficient base64 encoding using chunks instead of string concatenation
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const CHUNK_SIZE = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return jsonError('ANTHROPIC_API_KEY non configurée')
    }

    const body = await req.json()
    const { image_url } = body
    console.log(`[ocr-recipe] Received request for: ${image_url?.substring(0, 80)}...`)

    if (!image_url) {
      return jsonError("URL de l'image requise", 400)
    }

    // Fetch image
    console.log('[ocr-recipe] Fetching image...')
    const imageResponse = await fetch(image_url)
    if (!imageResponse.ok) {
      return jsonError(`Impossible de télécharger l'image: HTTP ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageSizeKb = Math.round(imageBuffer.byteLength / 1024)
    console.log(`[ocr-recipe] Image fetched: ${imageSizeKb} KB`)

    // Encode to base64
    console.log('[ocr-recipe] Encoding base64...')
    const base64Image = arrayBufferToBase64(imageBuffer)
    console.log(`[ocr-recipe] Base64 length: ${base64Image.length}`)

    // Normalize content-type
    const rawContentType = (imageResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    const contentType = VALID_MEDIA_TYPES.includes(rawContentType) ? rawContentType : 'image/jpeg'
    console.log(`[ocr-recipe] Content-Type: ${rawContentType} → ${contentType}`)

    // Call Claude API
    console.log('[ocr-recipe] Calling Claude API...')
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
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: contentType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: SYSTEM_PROMPT,
              },
            ],
          },
        ],
      }),
    })

    const result = await response.json()
    console.log(`[ocr-recipe] Claude API response: ${response.status}`)

    if (!response.ok) {
      const errMsg = result.error?.message || JSON.stringify(result.error) || 'Erreur API Claude'
      return jsonError(`Claude API: ${errMsg}`)
    }

    const textContent = result.content?.find((c: { type: string }) => c.type === 'text')?.text
    if (!textContent) {
      return jsonError('Pas de texte dans la réponse Claude')
    }

    // Parse the JSON from Claude's response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error(`[ocr-recipe] Cannot parse JSON from: ${textContent.substring(0, 200)}`)
      return jsonError('Impossible de parser le JSON de la réponse')
    }

    const ocrResult = JSON.parse(jsonMatch[0])
    console.log(`[ocr-recipe] Success! Recipe: "${ocrResult.title}"`)

    return new Response(JSON.stringify(ocrResult), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error(`[ocr-recipe] CRASH:`, err)
    return jsonError(`Erreur interne: ${err instanceof Error ? err.message : String(err)}`)
  }
})
