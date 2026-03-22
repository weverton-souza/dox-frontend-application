import type { FormFieldAnswer, FormSectionGroup } from '@/types'
import FormFieldRenderer from '@/components/form-fill/FormFieldRenderer'

interface FormSectionFieldsProps {
  sectionGroups: FormSectionGroup[]
  getAnswer: (fieldId: string) => FormFieldAnswer
  onAnswerChange: (answer: FormFieldAnswer) => void
  validationErrors: Set<string>
  readOnly?: boolean
}

export default function FormSectionFields({
  sectionGroups,
  getAnswer,
  onAnswerChange,
  validationErrors,
}: FormSectionFieldsProps) {
  return (
    <>
      {sectionGroups.map((group) => (
        <div key={group.sectionFieldId}>
          {group.sectionField && (
            <div className="pt-4">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-1.5 bg-brand-400" />
                <div className="px-6 py-4">
                  <h2 className="text-base font-medium text-gray-800">
                    {group.sectionField.label || 'Seção sem título'}
                  </h2>
                  {group.sectionField.description && (
                    <p className="text-xs text-gray-400 mt-1">{group.sectionField.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {group.children.map((field) => {
            const hasError = validationErrors.has(field.id)

            return (
              <div
                key={field.id}
                className={`bg-white rounded-lg shadow-sm px-6 py-5 transition-shadow mt-3 ${
                  hasError
                    ? 'ring-1 ring-red-400 shadow-red-100'
                    : 'hover:shadow-md'
                }`}
              >
                <label className="block text-sm text-gray-900 mb-3">
                  {field.label || '(pergunta não definida)'}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {field.description && (
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">{field.description}</p>
                )}

                <FormFieldRenderer
                  field={field}
                  answer={getAnswer(field.id)}
                  onChange={onAnswerChange}
                />

                {hasError && (
                  <p className="text-xs text-red-500 mt-3 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Este campo é obrigatório
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}
