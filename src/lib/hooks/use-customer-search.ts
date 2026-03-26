import { useState, useEffect, useRef } from 'react'
import type { Customer } from '@/types'
import { getCustomers } from '@/lib/api/customer-api'

export function useCustomerSearch(isOpen: boolean) {
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const delay = search ? 300 : 0
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      getCustomers(0, 10, search || undefined)
        .then((page) => setCustomers(page.content))
        .finally(() => setLoading(false))
    }, delay)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, isOpen])

  const reset = () => {
    setSearch('')
    setCustomers([])
    setLoading(false)
  }

  return { search, setSearch, customers, loading, reset }
}
