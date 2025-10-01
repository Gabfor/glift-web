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
        "w-full max-w-[564px] rounded-[5px] border-r-[3px] px-4 py-3 text-left",
        className
      )}
      style={{
        backgroundColor: "#FFE3E3",
        borderRightColor: "#EF4F4E",
      }}
    >
      <div className="text-[12px] font-bold" style={{ color: "#BA2524" }}>
        {title}
      </div>
      {description ? (
        <div className="text-[12px] font-semibold" style={{ color: "#EF4F4E" }}>
          {description}
        </div>
      ) : null}
    </div>
  )
}
