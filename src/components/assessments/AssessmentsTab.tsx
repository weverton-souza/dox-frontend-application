import { useState, useEffect, useCallback } from 'react'
import type { Assessment } from '@/types'
import { useError } from '@/contexts/ErrorContext'
import { deleteAssessment, getAssessments } from '@/lib/api/assessment-api'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import AssessmentCard from './AssessmentCard'
import AssessmentEditModal from './AssessmentEditModal'

interface AssessmentsTabProps {
  customerId: string
  customerName: string
}

interface AssessmentGroup {
  root: Assessment
  reapplications: Assessment[]
}

function groupAssessments(assessments: Assessment[]): AssessmentGroup[] {
  const byId = new Map(assessments.map(a => [a.id, a]))
  const reapplicationsByRoot = new Map<string, Assessment[]>()
  const roots: Assessment[] = []

  for (const a of assessments) {
    if (a.parentAssessmentId && byId.has(a.parentAssessmentId)) {
      const list = reapplicationsByRoot.get(a.parentAssessmentId) ?? []
      list.push(a)
      reapplicationsByRoot.set(a.parentAssessmentId, list)
    } else {
      roots.push(a)
    }
  }

  return roots.map(root => ({
    root,
    reapplications: (reapplicationsByRoot.get(root.id) ?? []).sort((a, b) =>
      b.appliedAt.localeCompare(a.appliedAt),
    ),
  }))
}

export default function AssessmentsTab({ customerId, customerName }: AssessmentsTabProps) {
  const { showError } = useError()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Assessment | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const page = await getAssessments(customerId, 0, 50)
      setAssessments(page.content)
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }, [customerId, showError])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (assessment: Assessment) => {
    setEditing(assessment)
    setModalOpen(true)
  }

  const handleDelete = async (assessment: Assessment) => {
    const confirmed = window.confirm(
      `Excluir avaliação "${assessment.title}"?\n\nO registro será removido do prontuário. Reaplicações vinculadas perderão o vínculo.`,
    )
    if (!confirmed) return
    try {
      await deleteAssessment(customerId, assessment.id)
      await load()
    } catch (err) {
      showError(err)
    }
  }

  const handleSaved = () => {
    void load()
  }

  const groups = groupAssessments(assessments)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Avaliações aplicadas</h2>
          <p className="text-sm text-gray-600">
            {assessments.length === 0
              ? 'Nenhuma avaliação registrada'
              : `${groups.length} ${groups.length === 1 ? 'avaliação' : 'avaliações'} · ${assessments.length} ${assessments.length === 1 ? 'registro de sessão' : 'registros de sessão'}`}
          </p>
        </div>
        <Button onClick={openNew}>+ Nova avaliação</Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
        <strong>Aviso:</strong> A aplicação dos instrumentos e o cálculo dos escores são de responsabilidade
        do(a) profissional, conforme orientação do CFP. O DOX armazena apenas o registro dos resultados
        fornecidos.
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-sm text-gray-500">
          Nenhuma avaliação registrada ainda. Clique em "Nova avaliação" pra começar.
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="space-y-4">
          {groups.map(({ root, reapplications }) => (
            <div key={root.id} className="space-y-2">
              <AssessmentCard
                assessment={root}
                customerId={customerId}
                reapplications={reapplications}
                onEdit={() => openEdit(root)}
                onDelete={() => handleDelete(root)}
              />
              {reapplications.map(reapp => (
                <div key={reapp.id} className="ml-6 border-l-2 border-brand-200 pl-4">
                  <AssessmentCard
                    assessment={reapp}
                    customerId={customerId}
                    onEdit={() => openEdit(reapp)}
                    onDelete={() => handleDelete(reapp)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <AssessmentEditModal
        isOpen={modalOpen}
        customerId={customerId}
        customerName={customerName}
        existing={editing}
        previousAssessments={assessments}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
