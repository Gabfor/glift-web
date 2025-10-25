import clsx from "clsx"
import type { CSSProperties } from "react"

type SpinnerSize = "sm" | "md" | "lg"

type SpinnerProps = {
  size?: SpinnerSize
  className?: string
  ariaLabel?: string
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
}

const borderWidthMap: Record<SpinnerSize, number> = {
  sm: 2,
  md: 3,
  lg: 3,
}

export default function Spinner({ size = "sm", className, ariaLabel }: SpinnerProps) {
  const spinnerStyle = {
    width: `${sizeMap[size]}px`,
    height: `${sizeMap[size]}px`,
    ["--semantic-loader-border-width" as const]: `${borderWidthMap[size]}px`,
  } satisfies CSSProperties & Record<"--semantic-loader-border-width", string>

  const accessibilityProps = ariaLabel
    ? ({ "aria-label": ariaLabel } as const)
    : ({ "aria-hidden": true } as const)

  return (
    <span
      className={clsx(
        "relative inline-flex items-center justify-center",
        className,
      )}
      role={ariaLabel ? "status" : undefined}
      {...accessibilityProps}
      style={spinnerStyle}
    >
      <span className="semantic-loader-circle" />
      <style jsx>{`
        @keyframes semantic-loader-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .semantic-loader-circle {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .semantic-loader-circle::before {
          content: "";
          position: absolute;
          inset: 0;
          box-sizing: border-box;
          border-radius: 50%;
          border: var(--semantic-loader-border-width) solid rgba(58, 65, 111, 0.15);
          border-top-color: currentColor;
          animation: semantic-loader-spin 0.6s linear infinite;
        }
      `}</style>
    </span>
  )
}
