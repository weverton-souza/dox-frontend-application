interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={`${SIZES[size]} border-2 border-brand-500 border-t-transparent rounded-full animate-spin ${className}`} />
  )
}
