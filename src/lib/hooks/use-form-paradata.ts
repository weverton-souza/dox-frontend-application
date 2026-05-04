import { useCallback, useEffect, useRef } from 'react'

interface FieldStamp {
  at: number
  hidden: number
}

export function useFormParadata() {
  const totalHiddenMsRef = useRef(0)
  const hiddenSinceRef = useRef<number | null>(null)
  const fieldFirstRef = useRef<Map<string, FieldStamp>>(new Map())
  const fieldLastRef = useRef<Map<string, FieldStamp>>(new Map())
  const pageStartRef = useRef<FieldStamp | null>(null)

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        hiddenSinceRef.current = Date.now()
      } else if (hiddenSinceRef.current != null) {
        totalHiddenMsRef.current += Date.now() - hiddenSinceRef.current
        hiddenSinceRef.current = null
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const recordFieldInteraction = useCallback((fieldId: string) => {
    const stamp: FieldStamp = { at: Date.now(), hidden: totalHiddenMsRef.current }
    if (!fieldFirstRef.current.has(fieldId)) {
      fieldFirstRef.current.set(fieldId, stamp)
    }
    fieldLastRef.current.set(fieldId, stamp)
  }, [])

  const computeFieldInteractionMs = useCallback((fieldId: string): number | null => {
    const first = fieldFirstRef.current.get(fieldId)
    const last = fieldLastRef.current.get(fieldId)
    if (!first || !last) return null
    return Math.max(0, (last.at - first.at) - (last.hidden - first.hidden))
  }, [])

  const getFieldLastInteractionAt = useCallback((fieldId: string): string | null => {
    const last = fieldLastRef.current.get(fieldId)
    return last ? new Date(last.at).toISOString() : null
  }, [])

  const startPage = useCallback(() => {
    pageStartRef.current = { at: Date.now(), hidden: totalHiddenMsRef.current }
  }, [])

  const endPage = useCallback((): number => {
    if (!pageStartRef.current) return 0
    const start = pageStartRef.current
    const ms = Math.max(0, (Date.now() - start.at) - (totalHiddenMsRef.current - start.hidden))
    pageStartRef.current = null
    return ms
  }, [])

  return {
    recordFieldInteraction,
    computeFieldInteractionMs,
    getFieldLastInteractionAt,
    startPage,
    endPage,
  }
}
