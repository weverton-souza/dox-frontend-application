interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2
          ${checked ? 'bg-brand-500' : 'bg-gray-300'}
        `.trim()}
      >
        <span
          className={`
            absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200
            ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}
          `.trim()}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  )
}
