import { useEffect, useRef, useState } from 'react'
import { getPublicFormDraft, savePublicFormDraft } from '@/lib/api/public-form-api'

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseFormDraftResult<T> {
  initialDraft: T | null
  draftLoaded: boolean
  status: DraftStatus
  lastSavedAt: string | null
}

export function useFormDraft<T extends Record<string, unknown>>(
  token: string | undefined,
  payload: T | null,
  enabled: boolean,
  debounceMs: number = 5000,
): UseFormDraftResult<T> {
  const [initialDraft, setInitialDraft] = useState<T | null>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [status, setStatus] = useState<DraftStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSerializedRef = useRef<string>('')

  useEffect(() => {
    if (!token) {
      setDraftLoaded(true)
      return
    }
    let cancelled = false
    getPublicFormDraft(token)
      .then((draft) => {
        if (cancelled) return
        if (draft) {
          setInitialDraft(draft.partialResponse as T)
          setLastSavedAt(draft.savedAt)
          lastSerializedRef.current = JSON.stringify(draft.partialResponse)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDraftLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!enabled || !token || !draftLoaded || !payload) return

    const serialized = JSON.stringify(payload)
    if (serialized === lastSerializedRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setStatus('saving')
      savePublicFormDraft(token, payload)
        .then((draft) => {
          lastSerializedRef.current = serialized
          setLastSavedAt(draft.savedAt)
          setStatus('saved')
        })
        .catch(() => setStatus('error'))
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [token, payload, enabled, draftLoaded, debounceMs])

  return { initialDraft, draftLoaded, status, lastSavedAt }
}
