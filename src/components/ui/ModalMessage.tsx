import clsx from "clsx"
import { ReactNode } from "react"

type ModalMessageVariant = "warning" | "info" | "success"

const VARIANT_STYLES: Record<ModalMessageVariant, {
  background: string
  titleColor: string
  textColor: string
  barColor: string
}> = {
  warning: {
    background: "#FFE3E3",
    titleColor: "#BA2524",
    textColor: "#EF4F4E",
    barColor: "#EF4F4E",
  },
  info: {
    background: "#F4F5FE",
    titleColor: "#7069FA",
    textColor: "#A1A5FD",
    barColor: "#A1A5FD",
  },
  success: {
    background: "#E3F9E5",
    titleColor: "#207227",
    textColor: "#57AE5B",
    barColor: "#57AE5B",
  },
}

interface ModalMessageProps {
  variant: ModalMessageVariant
  title: ReactNode
  description: ReactNode
  className?: string
}

export default function ModalMessage({
  variant,
  title,
  description,
  className,
}: ModalMessageProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <div
      className={clsx(
        "rounded-br-[5px] rounded-tr-[5px] border-l-[3px] px-4 py-3 text-left",
        className
      )}
      style={{
        backgroundColor: styles.background,
        borderLeftColor: styles.barColor,
      }}
    >
      <div className="text-[12px] font-bold" style={{ color: styles.titleColor }}>
        {title}
      </div>
      <div className="text-[12px] font-semibold" style={{ color: styles.textColor }}>
        {description}
      </div>
    </div>
  )
}
