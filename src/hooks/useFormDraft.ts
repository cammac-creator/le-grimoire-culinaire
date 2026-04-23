import { useEffect, useRef } from 'react'
import type { UseFormReturn, FieldValues } from 'react-hook-form'

interface FormDraftOptions<T extends FieldValues> {
  /** Clé localStorage unique par formulaire (ex: 'recipe-draft-manual') */
  key: string
  /** Instance react-hook-form complète */
  form: UseFormReturn<T>
  /** Délai de debounce avant écriture localStorage (ms) */
  debounceMs?: number
  /** Callback déclenché si un brouillon est restauré */
  onRestored?: (draft: T) => void
  /** Désactiver la persistance (ex: après save success pour purger) */
  enabled?: boolean
}

/**
 * Persiste l'état d'un formulaire react-hook-form dans localStorage.
 *
 * Auto-save debounced à chaque modification, restauration synchrone au
 * montage si un brouillon est trouvé. Ne stocke que les valeurs (pas les
 * erreurs ou metadata).
 *
 * Usage :
 * ```ts
 * const form = useForm<RecipeFormData>({...})
 * const { clearDraft } = useFormDraft({ key: 'recipe-draft-manual', form })
 * // après save success → clearDraft() pour purger
 * ```
 */
export function useFormDraft<T extends FieldValues>({
  key,
  form,
  debounceMs = 600,
  onRestored,
  enabled = true,
}: FormDraftOptions<T>) {
  const restoredRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  // Restoration au montage (une seule fois)
  useEffect(() => {
    if (restoredRef.current || !enabled) return
    restoredRef.current = true
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const draft = JSON.parse(raw) as T
      form.reset(draft)
      onRestored?.(draft)
    } catch {
      // JSON invalide ou storage indisponible → ignore
    }
    // Volontairement sans deps : restauration UNE fois au montage du form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save debounced sur chaque watch
  useEffect(() => {
    if (!enabled) return
    const subscription = form.watch((values) => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(values))
        } catch {
          // QuotaExceeded → ignore
        }
      }, debounceMs)
    })
    return () => {
      subscription.unsubscribe()
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [form, key, debounceMs, enabled])

  const clearDraft = () => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }

  const hasDraft = () => {
    try {
      return !!localStorage.getItem(key)
    } catch {
      return false
    }
  }

  return { clearDraft, hasDraft }
}
