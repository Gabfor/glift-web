"use client"

import { ReactNode } from "react"
import ModalMessage from "./ModalMessage"

interface ErrorMessageProps {
  title: ReactNode
  description?: ReactNode
  className?: string
  onClose?: () => void
}

export default function ErrorMessage({
  title,
  description,
  className,
  onClose,
}: ErrorMessageProps) {
  return (
    <ModalMessage
      variant="warning"
      title={title}
      description={description}
      className={className}
      onClose={onClose}
    />
  )
}
