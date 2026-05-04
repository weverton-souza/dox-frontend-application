import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

type IconButtonSize = 'sm' | 'md'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  icon: ReactNode
  /** Texto descritivo. Vira aria-label e title (tooltip). Obrigatorio para acessibilidade. */
  label: string
  size?: IconButtonSize
  ref?: Ref<HTMLButtonElement>
}

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'p-1',
  md: 'p-2',
}

export default function IconButton({
  icon,
  label,
  size = 'md',
  className = '',
  type = 'button',
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`
        ${sizeStyles[size]}
        rounded-full text-gray-500 hover:bg-gray-100 transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
        disabled:opacity-50 disabled:pointer-events-none
        ${className}
      `.trim()}
      {...props}
    >
      {icon}
    </button>
  )
}
