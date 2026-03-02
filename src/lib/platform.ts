/**
 * Detecte si l'appareil supporte les Raccourcis Apple (Shortcuts).
 * Couvre iPhone, iPad, iPod et macOS (Monterey+).
 */
export function supportsAppleShortcuts(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPod|iPad/.test(ua)) return true
  if (/Macintosh/.test(ua)) return true
  return false
}
