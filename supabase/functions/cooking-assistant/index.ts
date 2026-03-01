import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { getCorsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

function jsonError(message: string, cors: Record<string, string>, status = 500) {
  console.error(`[cooking-assistant] ERROR: ${message}`)
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

  if (!ANTHROPIC_API_KEY) {
    return jsonError('ANTHROPIC_API_KEY non configurée', CORS)
  }

  try {
    const { message, recipe, history } = await req.json()
    if (!message || !recipe) {
      return jsonError('Message et recette requis', CORS, 400)
    }

    const ingredientList = (recipe.ingredients ?? [])
      .map((i: { quantity: string; unit: string; name: string }) =>
        `${i.quantity} ${i.unit} ${i.name}`.trim()
      )
      .join('\n')

    const stepList = (recipe.steps ?? [])
      .map((s: { number: number; text: string }) => `${s.number}. ${s.text}`)
      .join('\n')

    const systemPrompt = `Tu es un assistant culinaire intégré au Grimoire Culinaire.
L'utilisateur cuisine actuellement : ${recipe.title}

Ingrédients :
${ingredientList}

Étapes :
${stepList}

Aide-le de manière concise et pratique. Réponds en français.
Tu peux : expliquer une étape, proposer des substitutions, convertir des unités, donner des conseils de cuisson.
Sois bref (2-3 phrases max) car l'utilisateur a les mains occupées.`

    const messages = [
      ...(history ?? []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

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
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return jsonError(`Erreur API: ${err}`, CORS)
    }

    const result = await response.json()
    const text = result.content?.[0]?.text ?? ''

    return new Response(JSON.stringify({ reply: text }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Erreur inconnue', CORS)
  }
})
