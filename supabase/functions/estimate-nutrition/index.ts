import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { getCorsHeaders } from '../_shared/cors.ts'
import { getAuthUser } from '../_shared/auth.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

function jsonError(message: string, cors: Record<string, string>, status = 500) {
  console.error(`[estimate-nutrition] ERROR: ${message}`)
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

Deno.serve(async (req) => {
  const CORS = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  const user = await getAuthUser(req)
  if (!user) console.warn('[estimate-nutrition] No authenticated user — proceeding anyway')

  if (!ANTHROPIC_API_KEY) {
    return jsonError('ANTHROPIC_API_KEY non configurée', CORS)
  }

  try {
    const { ingredients, servings } = await req.json()
    if (!ingredients || !Array.isArray(ingredients)) {
      return jsonError('Ingrédients requis', CORS, 400)
    }

    const ingredientList = ingredients
      .map((i: { quantity: string; unit: string; name: string }) =>
        `${i.quantity} ${i.unit} ${i.name}`.trim()
      )
      .join('\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Estime les informations nutritionnelles PAR PORTION pour cette recette (${servings || 1} portions).

Ingrédients :
${ingredientList}

Réponds UNIQUEMENT en JSON, sans texte autour :
{"calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number}

Les valeurs doivent être en grammes (sauf calories en kcal), arrondies à l'entier.`,
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return jsonError(`Erreur API Anthropic: ${err}`, CORS)
    }

    const result = await response.json()
    const text = result.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return jsonError('Réponse non parseable', CORS)
    }

    const nutrition = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(nutrition), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Erreur inconnue', CORS)
  }
})
