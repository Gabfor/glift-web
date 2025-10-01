import clsx from "clsx"
import { ReactNode } from "react"

interface ErrorMessageProps {
  title: ReactNode
  description?: ReactNode
  className?: string
}

export default function ErrorMessage({
  title,
  description,
  className,
}: ErrorMessageProps) {
  return (
    <div
      className={clsx(
        "w-full max-w-[564px] px-4 py-3 text-left border-l-[3px] rounded-tr-[5px] rounded-br-[5px]",
        className
      )}
      style={{
        backgroundColor: "#FFE3E3",
        borderLeftColor: "#EF4F4E",
      }}
    >
      <div className="text-[12px] font-bold" style={{ color: "#BA2524" }}>
        {title}
      </div>
      {description ? (
        <div className="text-[12px] font-semibold mt-1" style={{ color: "#EF4F4E" }}>
          {description}
        </div>
      ) : null}
    </div>
  )
}
