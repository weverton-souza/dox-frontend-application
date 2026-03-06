// ========== Generic localStorage utilities ==========

/**
 * Reads an array from localStorage, returning fallback on missing/invalid data.
 */
export function readFromStorage<T>(key: string, fallback: T[] = []): T[] {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T[]
  } catch {
    return fallback
  }
}

/**
 * Writes an array to localStorage.
 */
export function writeToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

/**
 * Upserts an item (by id) in a localStorage array.
 * If the item exists, replaces it; otherwise appends it.
 * Optionally stamps `updatedAt` with current ISO string.
 */
export function upsertInStorage<T extends { id: string }>(
  key: string,
  item: T,
  getter: () => T[],
  stampUpdatedAt = true,
): T {
  const items = getter()
  const index = items.findIndex((i) => i.id === item.id)
  const updated = stampUpdatedAt
    ? { ...item, updatedAt: new Date().toISOString() }
    : item

  if (index >= 0) {
    items[index] = updated
  } else {
    items.push(updated)
  }

  writeToStorage(key, items)
  return updated
}

/**
 * Deletes items from a localStorage array by a filter predicate.
 * Keeps items where `keepFn` returns true.
 */
export function deleteFromStorage<T>(
  key: string,
  keepFn: (item: T) => boolean,
): void {
  const raw = localStorage.getItem(key)
  if (!raw) return
  try {
    const items = (JSON.parse(raw) as T[]).filter(keepFn)
    localStorage.setItem(key, JSON.stringify(items))
  } catch { /* ignore */ }
}
