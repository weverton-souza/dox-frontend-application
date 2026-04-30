import { useEffect, useState, useCallback } from 'react'
import type { AccessibleModule, AccessLevel, ModuleId } from '@/types'
import { listAccessibleModules } from '@/lib/api/billing-api'

interface ModulesState {
  modules: AccessibleModule[]
  loading: boolean
  error: unknown | null
}

interface ModulesContextValue extends ModulesState {
  refetch: () => Promise<void>
}

let cachedState: ModulesState = { modules: [], loading: true, error: null }
let listeners = new Set<() => void>()
let fetchPromise: Promise<void> | null = null

function notify() {
  listeners.forEach((l) => l())
}

async function fetchModules(force = false) {
  if (fetchPromise && !force) return fetchPromise
  cachedState = { ...cachedState, loading: true }
  notify()
  fetchPromise = listAccessibleModules()
    .then((modules) => {
      cachedState = { modules, loading: false, error: null }
    })
    .catch((error) => {
      cachedState = { modules: [], loading: false, error }
    })
    .finally(() => {
      fetchPromise = null
      notify()
    })
  return fetchPromise
}

export function useAccessibleModules(): ModulesContextValue {
  const [, setTick] = useState(0)
  const refetch = useCallback(() => fetchModules(true), [])

  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.add(listener)
    if (cachedState.modules.length === 0 && !fetchPromise && cachedState.error === null) {
      fetchModules()
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    modules: cachedState.modules,
    loading: cachedState.loading,
    error: cachedState.error,
    refetch,
  }
}

export interface ModuleAccessInfo {
  hasAccess: boolean
  accessLevel: AccessLevel
  loading: boolean
}

export function useModule(moduleId: ModuleId): ModuleAccessInfo {
  const { modules, loading, error } = useAccessibleModules()
  if (loading) return { hasAccess: true, accessLevel: 'FULL', loading: true }
  if (error || modules.length === 0) return { hasAccess: true, accessLevel: 'FULL', loading: false }
  const entry = modules.find((m) => m.id === moduleId)
  if (!entry) return { hasAccess: false, accessLevel: 'BLOCKED', loading: false }
  return {
    hasAccess: entry.accessLevel !== 'BLOCKED',
    accessLevel: entry.accessLevel,
    loading: false,
  }
}
