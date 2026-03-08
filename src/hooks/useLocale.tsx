import { createContext, useContext, useCallback, useState, type ReactNode } from 'react'
import { type Locale, type TranslationKey, getTranslation } from '@/lib/i18n'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const LocaleContext = createContext<LocaleState | null>(null)

function getStoredLocale(): Locale {
  const stored = localStorage.getItem('locale')
  if (stored === 'fr' || stored === 'de' || stored === 'en') return stored
  return 'fr'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
    document.documentElement.lang = l
  }, [])

  const t = useCallback((key: TranslationKey) => {
    return getTranslation(key, locale)
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleState {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
