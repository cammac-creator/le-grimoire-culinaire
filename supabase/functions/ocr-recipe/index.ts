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
- Si l'écriture est difficile à lire, indique [illisible] dans le texte`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { image_url } = await req.json()

  if (!image_url) {
    return new Response(
      JSON.stringify({ error: "URL de l'image requise" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Fetch image and convert to base64
  const imageResponse = await fetch(image_url)
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = btoa(
    new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  )

  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

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

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: result.error?.message || 'Erreur API Claude' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const textContent = result.content?.find((c: { type: string }) => c.type === 'text')?.text
  if (!textContent) {
    return new Response(
      JSON.stringify({ error: 'Pas de texte dans la réponse' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Parse the JSON from Claude's response
  const jsonMatch = textContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return new Response(
      JSON.stringify({ error: 'Impossible de parser le JSON' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const ocrResult = JSON.parse(jsonMatch[0])

  return new Response(JSON.stringify(ocrResult), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
