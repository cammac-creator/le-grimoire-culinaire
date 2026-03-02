/**
 * Detecte si l'appareil est un iPhone, iPad ou iPod.
 * Couvre aussi l'iPad sous iOS 13+ qui se presente comme "Macintosh".
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPod/.test(ua)) return true
  // iPad iOS 13+ se fait passer pour Mac — on teste les touch points
  if (/iPad/.test(ua)) return true
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true
  return false
}
