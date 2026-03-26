import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Customer, ReportTemplate } from '@/types'
import { createReportFromCustomer, createReportFromTemplate } from '@/lib/report-utils'
import { useError } from '@/contexts/ErrorContext'

export function useCreateReport() {
  const navigate = useNavigate()
  const { showError } = useError()
  const [customer, setCustomer] = useState<Customer | null>(null)

  const showModal = useCallback((c: Customer) => setCustomer(c), [])
  const hideModal = useCallback(() => setCustomer(null), [])

  const createBlank = useCallback(async () => {
    if (!customer) return
    try {
      const report = await createReportFromCustomer(customer)
      navigate(`/reports/${report.id}`)
    } catch (err) {
      showError(err)
    }
  }, [customer, navigate, showError])

  const createFromTemplate = useCallback(async (template: ReportTemplate) => {
    if (!customer) return
    try {
      const report = await createReportFromTemplate(customer, template)
      navigate(`/reports/${report.id}`)
    } catch (err) {
      showError(err)
    }
  }, [customer, navigate, showError])

  return {
    reportCustomer: customer,
    isModalOpen: customer !== null,
    showModal,
    hideModal,
    createBlank,
    createFromTemplate,
  }
}
