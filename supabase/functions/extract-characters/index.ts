import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `Tu es un spécialiste en analyse d'écriture manuscrite. Ton rôle est d'identifier et localiser les meilleures instances isolées de chaque caractère français dans une image de texte manuscrit.

Pour chaque caractère que tu identifies, fournis :
- Le caractère exact (en respectant la casse)
- Sa bounding box normalisée (valeurs entre 0 et 1 par rapport aux dimensions de l'image) : x, y, width, height
- Un score de confiance entre 0 et 1

RÈGLES CRITIQUES POUR LES BOUNDING BOXES :
- La bounding box doit être GÉNÉREUSE : inclure une marge d'au moins 30% autour du caractère
- Il vaut mieux une box TROP GRANDE que trop petite — on recadrera ensuite
- x et y représentent le coin SUPÉRIEUR GAUCHE de la zone
- width et height représentent la taille TOTALE de la zone
- Pour une lettre typique manuscrite, width sera environ 0.02-0.05 et height environ 0.03-0.07
- NE PAS donner des boxes minuscules (width < 0.01) — c'est toujours trop petit

RÈGLES DE SÉLECTION DES CARACTÈRES :
- Privilégie les caractères les plus ISOLÉS : début/fin de mot, majuscules, chiffres séparés
- Évite les lettres connectées par la cursive (préfère les caractères clairement séparés)
- Pour chaque caractère, choisis la MEILLEURE instance (la plus lisible et isolée)
- Inclus tous les caractères français : a-z, A-Z, 0-9, accents (éèêëàâùûôîïç), ponctuation
- Si un même caractère apparaît plusieurs fois, ne retourne que la meilleure instance
- Les coordonnées sont normalisées : (0,0) = coin supérieur gauche, (1,1) = coin inférieur droit

Réponds UNIQUEMENT avec le JSON suivant, sans texte avant ou après :
{
  "glyphs": [
    { "character": "a", "bbox": { "x": 0.10, "y": 0.30, "width": 0.04, "height": 0.06 }, "confidence": 0.95 }
  ],
  "image_width": largeur_estimée_en_pixels,
  "image_height": hauteur_estimée_en_pixels
}`

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
      max_tokens: 8192,
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

  const extractionResult = JSON.parse(jsonMatch[0])

  return new Response(JSON.stringify(extractionResult), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
