interface PageSizeSelectorProps {
  id?: string
  pageSize: number
  onChange: (size: number) => void
  options?: number[]
}

export default function PageSizeSelector({
  id = 'page-size',
  pageSize,
  onChange,
  options = [10, 25, 50],
}: PageSizeSelectorProps) {
  return (
    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
      <label htmlFor={id} className="text-sm text-gray-400">
        Por página:
      </label>
      <select
        id={id}
        value={pageSize}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
