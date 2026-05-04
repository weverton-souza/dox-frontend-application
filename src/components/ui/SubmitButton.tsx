import { useFormStatus } from 'react-dom'
import Button from './Button'
import type { ComponentProps, ReactNode } from 'react'

interface SubmitButtonProps extends Omit<ComponentProps<typeof Button>, 'type'> {
  pendingLabel?: ReactNode
}

export default function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  )
}
