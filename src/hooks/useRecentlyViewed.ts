import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'grimoire:recently-viewed'
const MAX_ITEMS = 20

export interface RecentEntry {
  id: string
  title: string
  category: string
  viewedAt: number
}

let listeners: (() => void)[] = []

function emitChange() {
  listeners.forEach((l) => l())
}

function getSnapshot(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

let cachedSnapshot = getSnapshot()

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshotStable() {
  const fresh = getSnapshot()
  if (JSON.stringify(fresh) !== JSON.stringify(cachedSnapshot)) {
    cachedSnapshot = fresh
  }
  return cachedSnapshot
}

export function useRecentlyViewed() {
  const entries = useSyncExternalStore(subscribe, getSnapshotStable)

  const addEntry = useCallback((entry: Omit<RecentEntry, 'viewedAt'>) => {
    const current = getSnapshot()
    const filtered = current.filter((e) => e.id !== entry.id)
    const updated = [{ ...entry, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    cachedSnapshot = updated
    emitChange()
  }, [])

  return { recentlyViewed: entries, addEntry }
}
