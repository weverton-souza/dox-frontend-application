import { useState, useCallback, useRef, useEffect } from 'react'
import { ScoreTableData, createEmptyScoreTableRow, createScoreTableColumn } from '@/types'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface ScoreTableBlockProps {
  data: ScoreTableData
  onChange: (data: ScoreTableData) => void
}

export default function ScoreTableBlock({ data, onChange }: ScoreTableBlockProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing a column name
  useEffect(() => {
    if (editingColumnId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingColumnId])

  const addColumn = useCallback(() => {
    const newCol = createScoreTableColumn('')
    // Add an empty value for this column in every existing row
    const updatedRows = data.rows.map((row) => ({
      ...row,
      values: { ...row.values, [newCol.id]: '' },
    }))
    onChange({
      ...data,
      columns: [...data.columns, newCol],
      rows: updatedRows,
    })
    // Start editing the new column name immediately
    setEditingColumnId(newCol.id)
  }, [data, onChange])

  const removeColumn = useCallback(
    (colId: string) => {
      const columns = data.columns.filter((c) => c.id !== colId)
      // Remove this column's value from all rows
      const rows = data.rows.map((row) => {
        const values = { ...row.values }
        delete values[colId]
        return { ...row, values }
      })
      onChange({ ...data, columns, rows })
    },
    [data, onChange]
  )

  const renameColumn = useCallback(
    (colId: string, label: string) => {
      const columns = data.columns.map((c) =>
        c.id === colId ? { ...c, label } : c
      )
      onChange({ ...data, columns })
    },
    [data, onChange]
  )

  const addRow = useCallback(() => {
    onChange({
      ...data,
      rows: [...data.rows, createEmptyScoreTableRow(data.columns)],
    })
  }, [data, onChange])

  const updateCell = useCallback(
    (rowId: string, colId: string, value: string) => {
      const rows = data.rows.map((row) =>
        row.id === rowId
          ? { ...row, values: { ...row.values, [colId]: value } }
          : row
      )
      onChange({ ...data, rows })
    },
    [data, onChange]
  )

  const removeRow = useCallback(
    (rowId: string) => {
      const rows = data.rows.filter((row) => row.id !== rowId)
      onChange({ ...data, rows })
    },
    [data, onChange]
  )

  return (
    <div className="space-y-4">
      <Input
        label="Título da tabela"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Título da tabela"
      />

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-700">
              {data.columns.map((col) => (
                <th
                  key={col.id}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white min-w-[120px]"
                >
                  {editingColumnId === col.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={col.label}
                      onChange={(e) => renameColumn(col.id, e.target.value)}
                      onBlur={() => setEditingColumnId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingColumnId(null)
                      }}
                      className="bg-white/20 text-white placeholder:text-white/50 border-0 rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider w-full focus:outline-none focus:ring-1 focus:ring-white/50"
                      placeholder="Nome da coluna"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <span
                        className="truncate cursor-pointer hover:underline"
                        onClick={() => setEditingColumnId(col.id)}
                        title="Clique para renomear"
                      >
                        {col.label || 'Sem nome'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeColumn(col.id)}
                        className="p-0.5 rounded hover:bg-white/20 text-white/40 hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        title="Remover coluna"
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
              ))}
              {/* Add column button */}
              <th className="w-12 px-1 py-2">
                <button
                  type="button"
                  onClick={addColumn}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white/70 hover:text-white hover:bg-white/20 transition-colors whitespace-nowrap"
                  title="Adicionar coluna"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                </button>
              </th>
              {/* Row delete column */}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={data.columns.length + 2}
                  className="px-3 py-6 text-center text-gray-400 text-sm"
                >
                  Nenhuma linha adicionada. Clique em "Adicionar linha" abaixo.
                </td>
              </tr>
            ) : (
              data.rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {data.columns.map((col) => (
                    <td key={col.id} className="px-1 py-1">
                      <input
                        type="text"
                        value={row.values[col.id] ?? ''}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                        className="w-full bg-transparent border-0 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded"
                        placeholder="-"
                      />
                    </td>
                  ))}
                  {/* Empty cell for add-column column */}
                  <td className="w-12" />
                  <td className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remover linha"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Button variant="ghost" size="sm" onClick={addRow}>
        + Adicionar linha
      </Button>

      <Input
        label="Nota de rodapé"
        value={data.footnote}
        onChange={(e) => onChange({ ...data, footnote: e.target.value })}
        placeholder="Nota de rodapé (opcional)"
      />
    </div>
  )
}
