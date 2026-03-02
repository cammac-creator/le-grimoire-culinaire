/**
 * Integration avec les Raccourcis Apple (Shortcuts) pour lancer
 * le minuteur natif iOS depuis l'app web.
 */

/** Nom exact du Raccourci tel que cree sur l'iPhone */
export const SHORTCUT_NAME = 'Minuteur Grimoire'

/**
 * Lien iCloud du Raccourci a partager.
 * L'utilisateur doit creer le raccourci puis coller le lien ici.
 */
export const SHORTCUT_INSTALL_URL = 'https://www.icloud.com/shortcuts/a38d6072393e479086ad1564c042ad14'

const STORAGE_KEY = 'grimoire_ios_shortcut_installed'

/** Verifie si l'utilisateur a deja indique avoir installe le raccourci */
export function isShortcutInstalled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Marque le raccourci comme installe */
export function markShortcutInstalled(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // localStorage indisponible (mode prive Safari, etc.)
  }
}

/**
 * Lance le Raccourci Apple avec le nombre de secondes en input.
 * Le raccourci recoit le texte, extrait le nombre, divise par 60,
 * arrondit et lance le minuteur natif.
 */
export function triggerIOSTimer(seconds: number): void {
  const encoded = encodeURIComponent(SHORTCUT_NAME)
  window.location.href = `shortcuts://run-shortcut?name=${encoded}&input=text&text=${seconds}`
}

/**
 * Detecte si le raccourci a echoue (l'app Raccourcis ne s'est pas ouverte).
 * Si la page redevient visible en moins de `thresholdMs`, c'est que
 * l'URL scheme n'a pas ete gere → le raccourci n'est probablement pas installe.
 *
 * @returns Une fonction cleanup pour retirer le listener
 */
export function detectShortcutFailure(
  onFailure: () => void,
  thresholdMs = 2500,
): () => void {
  const start = Date.now()

  function handleVisibility() {
    if (document.visibilityState === 'visible') {
      cleanup()
      if (Date.now() - start < thresholdMs) {
        onFailure()
      }
    }
  }

  function cleanup() {
    document.removeEventListener('visibilitychange', handleVisibility)
  }

  document.addEventListener('visibilitychange', handleVisibility)

  // Fallback : si apres le seuil rien ne s'est passe, cleanup silencieux
  const timer = setTimeout(cleanup, thresholdMs + 500)

  return () => {
    cleanup()
    clearTimeout(timer)
  }
}
