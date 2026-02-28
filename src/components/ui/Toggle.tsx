interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const Toggle = ({ label, checked, onChange }: ToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
          ${checked ? 'bg-brand-500' : 'bg-gray-300'}
        `.trim()}
      >
        <span
          className={`
            absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform
            ${checked ? 'translate-x-4' : 'translate-x-0.5'}
          `.trim()}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  )
}

export default Toggle
