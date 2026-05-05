import { useCallback, useEffect, useRef, useState } from 'react'
import type { Form } from '@/types'
import { updateForm } from '@/lib/api/form-api'

export type FormBuilderDraftStatus = 'idle' | 'publishing'

interface StoredDraft {
  formId: string
  data: Form
  savedAt: string
}

const STORAGE_PREFIX = 'dox-form-builder-draft:'

function storageKey(formId: string) {
  return `${STORAGE_PREFIX}${formId}`
}

function readDraft(formId: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(formId))
    if (!raw) return null
    return JSON.parse(raw) as StoredDraft
  } catch {
    return null
  }
}

function writeDraft(formId: string, data: Form) {
  try {
    const payload: StoredDraft = { formId, data, savedAt: new Date().toISOString() }
    localStorage.setItem(storageKey(formId), JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

function clearDraft(formId: string) {
  try {
    localStorage.removeItem(storageKey(formId))
  } catch {
    /* ignore */
  }
}

function deepEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useFormBuilderDraft() {
  const [form, setForm] = useState<Form | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const publishedRef = useRef<Form | null>(null)
  const formIdRef = useRef<string | null>(null)

  const isDirty =
    form !== null && publishedRef.current !== null
      ? !deepEqual(form, publishedRef.current)
      : false

  const hydrate = useCallback((serverForm: Form, opts?: { markDirty?: boolean }) => {
    publishedRef.current = serverForm
    formIdRef.current = serverForm.id

    const stored = readDraft(serverForm.id)
    if (stored && !deepEqual(stored.data, serverForm)) {
      setForm(stored.data)
      return
    }

    if (opts?.markDirty) {
      const next = { ...serverForm }
      writeDraft(serverForm.id, next)
      setForm(next)
    } else {
      setForm(serverForm)
    }
  }, [])

  const update = useCallback((patch: Partial<Form>) => {
    setForm((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      const id = formIdRef.current
      const published = publishedRef.current
      if (id && published) {
        if (deepEqual(next, published)) {
          clearDraft(id)
        } else {
          writeDraft(id, next)
        }
      }
      return next
    })
  }, [])

  const publish = useCallback(async (): Promise<Form | null> => {
    if (!form || !formIdRef.current) return null
    setIsPublishing(true)
    try {
      const saved = await updateForm(form)
      publishedRef.current = saved
      setForm(saved)
      clearDraft(formIdRef.current)
      return saved
    } finally {
      setIsPublishing(false)
    }
  }, [form])

  const discard = useCallback(() => {
    if (!publishedRef.current || !formIdRef.current) return
    setForm(publishedRef.current)
    clearDraft(formIdRef.current)
  }, [])

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const status: FormBuilderDraftStatus = isPublishing ? 'publishing' : 'idle'

  return { form, isDirty, status, hydrate, update, publish, discard }
}
