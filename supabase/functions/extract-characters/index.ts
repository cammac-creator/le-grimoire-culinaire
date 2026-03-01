import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// ─── Prompt : transcription structurée du texte manuscrit ───

const TRANSCRIPTION_PROMPT = `Cette image est une photo de recette de cuisine manuscrite.

Transcris TOUT le texte visible, ligne par ligne. Pour chaque ligne :
- Décompose CHAQUE mot en ses lettres individuelles séparées par des espaces
- Indique les espaces entre mots avec le symbole ▪
- Respecte strictement la casse (majuscule/minuscule)
- Inclus les caractères français accentués exacts (é, è, ê, ë, à, â, ù, û, ô, î, ï, ç)
- Inclus les chiffres et la ponctuation

Exemple de sortie pour la ligne "Bœuf braisé 250g" :
B œ u f ▪ b r a i s é ▪ 2 5 0 g

Réponds UNIQUEMENT avec le JSON suivant, sans texte avant ou après :
{
  "lines": [
    "P â t e ▪ b r i s é e",
    "2 5 0 g ▪ d e ▪ f a r i n e",
    "1 2 5 g ▪ d e ▪ b e u r r e"
  ]
}`

// ─── Prompt : labeling du montage (approche complémentaire) ───

const LABELING_PROMPT = `Cette image est une grille numérotée de caractères manuscrits extraits d'une recette de cuisine.
Chaque cellule contient UN caractère manuscrit avec un numéro rouge en haut à gauche.

Pour chaque cellule numérotée contenant un caractère CLAIREMENT lisible, identifie le caractère.

Règles :
- Respecte la casse (minuscule / majuscule)
- Inclus les caractères français accentués (é, è, ê, ë, à, â, ù, û, ô, î, ï, ç et majuscules)
- Inclus les chiffres (0-9) et la ponctuation (.,;:!?'-")
- IGNORE les cellules qui contiennent du bruit, des fragments, ou des caractères illisibles
- Chaque valeur doit être EXACTEMENT un seul caractère
- Si un même caractère apparaît dans plusieurs cellules, inclus-les toutes

Réponds UNIQUEMENT avec le JSON suivant, sans texte avant ou après :
{
  "labels": {
    "1": "a",
    "2": "B",
    "3": "é"
  }
}`

// ─── Handler ────────────────────────────────────────────

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

  const body = await req.json()
  const { image_base64, content_type = 'image/png', mode = 'transcribe' } = body

  if (!image_base64) {
    return new Response(
      JSON.stringify({ error: 'image_base64 requis' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const prompt = mode === 'label' ? LABELING_PROMPT : TRANSCRIPTION_PROMPT

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
                media_type: content_type,
                data: image_base64,
              },
            },
            {
              type: 'text',
              text: prompt,
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

  const jsonMatch = textContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return new Response(
      JSON.stringify({ error: 'Impossible de parser le JSON' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const parsed = JSON.parse(jsonMatch[0])

  return new Response(JSON.stringify(parsed), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
