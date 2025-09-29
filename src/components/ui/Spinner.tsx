import clsx from 'clsx'

type SpinnerSize = 'sm' | 'md' | 'lg'

type SpinnerProps = {
  size?: SpinnerSize
  className?: string
  ariaLabel?: string
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export default function Spinner({ size = 'sm', className, ariaLabel }: SpinnerProps) {
  return (
    <svg
      className={clsx('animate-spin text-current', sizeMap[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label={ariaLabel}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}
