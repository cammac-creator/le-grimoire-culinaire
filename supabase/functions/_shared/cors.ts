const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:4173']

function getAllowedOrigins(): string[] {
  const env = Deno.env.get('ALLOWED_ORIGINS')
  if (env) {
    return [...env.split(',').map((o) => o.trim()), ...DEFAULT_ORIGINS]
  }
  return DEFAULT_ORIGINS
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowed = getAllowedOrigins()
  const isAllowed = allowed.some((o) => origin === o) || /^https:\/\/le-grimoire-culinaire[a-z0-9-]*\.vercel\.app$/.test(origin)

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}
