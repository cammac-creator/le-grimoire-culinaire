import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

function jsonError(message: string, cors: Record<string, string>, status = 500) {
  console.error(`[generate-recipe-image] ERROR: ${message}`)
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

function buildPrompt(title: string, category: string, ingredients: { name: string }[]): string {
  const ingredientNames = ingredients
    .slice(0, 8)
    .map((i) => i.name)
    .join(', ')

  return `Photographie culinaire professionnelle d'un plat "${title}" (${category}).
Ingrédients principaux : ${ingredientNames}.
Style : éclairage naturel doux, vue de dessus à 45 degrés, assiette sur table en bois rustique, mise en scène magazine cuisine, couleurs vives et appétissantes, arrière-plan flou, haute résolution.
Ne pas inclure de texte dans l'image.`
}

Deno.serve(async (req) => {
  const CORS = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    if (!GEMINI_API_KEY) {
      return jsonError('GEMINI_API_KEY non configurée', CORS)
    }

    const body = await req.json()
    const { title, category, ingredients } = body

    if (!title) {
      return jsonError('title requis', CORS, 400)
    }

    const prompt = buildPrompt(title, category ?? 'plat', ingredients ?? [])
    console.log(`[generate-recipe-image] Generating image for: "${title}"`)

    // Call Gemini API for image generation
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    })

    const geminiResult = await geminiResponse.json()

    if (!geminiResponse.ok) {
      const errMsg = geminiResult.error?.message || JSON.stringify(geminiResult.error) || 'Erreur Gemini'
      return jsonError(`Gemini API: ${errMsg}`, CORS)
    }

    // Extract base64 image from response
    const parts = geminiResult.candidates?.[0]?.content?.parts
    if (!parts || parts.length === 0) {
      return jsonError('Pas de contenu dans la réponse Gemini', CORS)
    }

    const imagePart = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data)
    if (!imagePart?.inlineData?.data) {
      return jsonError('Pas d\'image dans la réponse Gemini', CORS)
    }

    const base64Data = imagePart.inlineData.data
    const mimeType = imagePart.inlineData.mimeType || 'image/png'

    // Decode base64 to Uint8Array
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png'
    const storagePath = `generated/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('recipe-photos')
      .upload(storagePath, bytes, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      return jsonError(`Upload Storage: ${uploadError.message}`, CORS)
    }

    console.log(`[generate-recipe-image] Success! Uploaded to: ${storagePath}`)

    return new Response(JSON.stringify({ storage_path: storagePath }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    console.error('[generate-recipe-image] CRASH:', err)
    return jsonError(`Erreur interne: ${err instanceof Error ? err.message : String(err)}`, CORS)
  }
})
