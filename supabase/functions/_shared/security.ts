// Garde-fous mutualisés pour les edge functions

export const MAX_JSON_BODY_BYTES = 8 * 1024 * 1024 // 8 MB (image_base64 fits ~6 MB raw)

export async function readJsonBody<T = unknown>(req: Request): Promise<T> {
  const len = Number(req.headers.get('content-length') ?? '0')
  if (len > MAX_JSON_BODY_BYTES) {
    throw new BodyTooLargeError()
  }
  const text = await req.text()
  if (text.length > MAX_JSON_BODY_BYTES) {
    throw new BodyTooLargeError()
  }
  return JSON.parse(text) as T
}

export class BodyTooLargeError extends Error {
  constructor() {
    super(`Body trop volumineux (max ${MAX_JSON_BODY_BYTES} octets)`)
    this.name = 'BodyTooLargeError'
  }
}

// IPv4 ranges considérés "internes" — bloqués pour anti-SSRF
const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [ipToInt('10.0.0.0'), ipToInt('10.255.255.255')],
  [ipToInt('172.16.0.0'), ipToInt('172.31.255.255')],
  [ipToInt('192.168.0.0'), ipToInt('192.168.255.255')],
  [ipToInt('127.0.0.0'), ipToInt('127.255.255.255')],
  [ipToInt('169.254.0.0'), ipToInt('169.254.255.255')], // link-local + AWS metadata
  [ipToInt('0.0.0.0'), ipToInt('0.255.255.255')],
  [ipToInt('100.64.0.0'), ipToInt('100.127.255.255')], // CGNAT
]

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0
}

function isPrivateIPv4(ip: string): boolean {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return false
  const v = ipToInt(ip)
  return PRIVATE_IPV4_RANGES.some(([lo, hi]) => v >= lo && v <= hi)
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  return (
    lower === '::1' ||
    lower.startsWith('fc') || lower.startsWith('fd') || // fc00::/7 unique local
    lower.startsWith('fe80:') || // link-local
    lower.startsWith('::ffff:') // IPv4-mapped — le caller doit aussi check IPv4
  )
}

/**
 * Valide qu'une URL externe est sûre à fetcher.
 * Bloque : protocoles non-http(s), hostnames internes, IPs privées/loopback/cloud-metadata.
 */
export function assertSafeExternalUrl(rawUrl: string): URL {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new UnsafeUrlError('URL invalide')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Seuls http(s) sont autorisés')
  }

  const host = url.hostname.toLowerCase()

  // Blocage hostnames suspects
  const blockedHosts = ['localhost', 'metadata.google.internal', 'metadata']
  if (blockedHosts.includes(host)) {
    throw new UnsafeUrlError('Hôte interne interdit')
  }

  // IPv4 ?
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (isPrivateIPv4(host)) {
      throw new UnsafeUrlError('IP privée/réservée interdite')
    }
    return url
  }

  // IPv6 (entre crochets dans une URL → URL().hostname renvoie sans crochets)
  if (host.includes(':')) {
    if (isPrivateIPv6(host)) {
      throw new UnsafeUrlError('IPv6 privée interdite')
    }
    return url
  }

  // Hostnames sans TLD = suspects (ex: "router")
  if (!host.includes('.')) {
    throw new UnsafeUrlError('Hostname sans TLD interdit')
  }

  return url
}

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeUrlError'
  }
}

/** Helper de réponse JSON avec CORS */
export function jsonWithCors(
  data: unknown,
  cors: Record<string, string>,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}
