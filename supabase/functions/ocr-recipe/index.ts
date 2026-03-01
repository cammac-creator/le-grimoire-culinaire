import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { getCorsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'extraction de recettes de cuisine à partir de photos manuscrites ou découpées de magazines.

ÉTAPE 1 — TRANSCRIPTION OBLIGATOIRE :
Avant toute extraction, transcris CHAQUE LIGNE visible dans l'image, du haut vers le bas, dans le champ "raw_lines". N'en saute aucune, même si tu n'es pas sûr de ce qu'elle dit. C'est la base de tout le reste.

ÉTAPE 2 — ANALYSE DES CHIFFRES AMBIGUS :
Pour CHAQUE nombre dans la transcription, remplis le champ "digit_analysis".
Décris visuellement les traits que tu vois :
- Un "1" manuscrit = UN SEUL trait vertical (parfois avec un petit empattement en haut)
- Un "4" manuscrit = un angle ouvert vers la droite + un trait vertical qui descend, formant un triangle ouvert. Le trait horizontal croise le trait vertical.
- "11" manuscrit = DEUX traits verticaux côte à côte, séparés par un petit espace. Ça ressemble à || ou II.
- PIÈGE FRÉQUENT : "11" (deux bâtons parallèles) est souvent confondu avec "4". Si tu vois deux traits verticaux parallèles → c'est "11", PAS "4".
- Un "4" a TOUJOURS un angle ou un trait horizontal. Si tu ne vois PAS d'angle ni de trait horizontal → ce n'est PAS un "4".

ÉTAPE 3 — VALIDATION CULINAIRE :
Vérifie chaque quantité avec ces références :
- Sucre dans un dessert : typiquement 80-200g (6-14 c. à soupe). Si tu lis "4 c. à soupe de sucre" pour un gâteau/tarte, c'est probablement "11".
- Farine dans une pâte : typiquement 150-300g (10-20 c. à soupe).
- Sel : rarement plus de 2 c. à soupe pour une recette.
- Si une quantité semble anormalement basse pour un dessert, REVÉRIFIE les traits du chiffre.

ÉTAPE 4 — EXTRACTION :
À partir de ta transcription et de ton analyse de chiffres, extrais les données structurées.

Réponds avec ce JSON :

{
  "raw_lines": ["ligne 1", "ligne 2", "...chaque ligne transcrite..."],
  "digit_analysis": [
    { "raw_text": "texte brut de la ligne", "digits_seen": "description des traits visuels", "corrected_number": "nombre final après analyse" }
  ],
  "title": "Titre de la recette",
  "ingredients": [
    { "name": "nom", "quantity": "quantité", "unit": "unité" }
  ],
  "steps": [
    { "number": 1, "text": "Description" }
  ],
  "servings": nombre_ou_null,
  "prep_time": minutes_ou_null,
  "cook_time": minutes_ou_null,
  "category": "entree|plat|dessert|boisson|sauce|accompagnement|pain|autre",
  "author_name": "auteur_ou_null"
}

INGRÉDIENTS :
- Chaque ligne de raw_lines contenant un chiffre + un aliment/condiment = un ingrédient
- Le sucre, sel, poivre, beurre, farine, crème, lait, etc. sont TOUJOURS des ingrédients
- "X cuillères à soupe de Y" → quantity: "X", unit: "c. à soupe", name: "Y"
- "X jus de citron" → quantity: "X", unit: "", name: "jus de citron"
- "1 pincée de sel" → quantity: "1", unit: "pincée", name: "sel"
- Si une ligne contient "+" (ex: "2 oeufs + 2 jaunes"), crée 2 ingrédients distincts
- VÉRIFIE que chaque ingrédient de raw_lines apparaît dans la liste finale
- UTILISE les chiffres corrigés de digit_analysis, PAS la première lecture

ÉTAPES :
- Instructions de préparation (verbes d'action : battre, mélanger, cuire, verser...)
- Le texte entre parenthèses fait souvent partie des étapes

Réponds UNIQUEMENT avec le JSON.`

function jsonError(message: string, corsHeaders: Record<string, string>, status = 500) {
  console.error(`[ocr-recipe] ERROR: ${message}`)
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  )
}

Deno.serve(async (req) => {
  const CORS_HEADERS = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return jsonError('ANTHROPIC_API_KEY non configurée', CORS_HEADERS)
    }

    const body = await req.json()
    const { image_url } = body
    console.log(`[ocr-recipe] Received request for: ${image_url?.substring(0, 80)}...`)

    if (!image_url) {
      return jsonError("URL de l'image requise", CORS_HEADERS, 400)
    }

    // Call Claude API with URL source (no base64 encoding needed)
    console.log('[ocr-recipe] Calling Claude API with image URL...')
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
                  type: 'url',
                  url: image_url,
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
      return jsonError(`Claude API: ${errMsg}`, CORS_HEADERS)
    }

    const textContent = result.content?.find((c: { type: string }) => c.type === 'text')?.text
    if (!textContent) {
      return jsonError('Pas de texte dans la réponse Claude', CORS_HEADERS)
    }

    // Parse the JSON from Claude's response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error(`[ocr-recipe] Cannot parse JSON from: ${textContent.substring(0, 200)}`)
      return jsonError('Impossible de parser le JSON de la réponse', CORS_HEADERS)
    }

    const ocrResult = JSON.parse(jsonMatch[0])
    console.log(`[ocr-recipe] Success! Recipe: "${ocrResult.title}"`)
    if (ocrResult.raw_lines) {
      console.log(`[ocr-recipe] Transcribed ${ocrResult.raw_lines.length} lines:`, ocrResult.raw_lines)
      delete ocrResult.raw_lines
    }
    if (ocrResult.digit_analysis) {
      console.log(`[ocr-recipe] Digit analysis:`, JSON.stringify(ocrResult.digit_analysis))
      delete ocrResult.digit_analysis
    }

    return new Response(JSON.stringify(ocrResult), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error(`[ocr-recipe] CRASH:`, err)
    return jsonError(`Erreur interne: ${err instanceof Error ? err.message : String(err)}`, CORS_HEADERS)
  }
})
