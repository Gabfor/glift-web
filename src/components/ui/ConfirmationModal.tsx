"use client"

import clsx from "clsx"
import { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react"
import CTAButton from "@/components/CTAButton"
import Modal from "@/components/ui/Modal"
import ModalMessage from "@/components/ui/ModalMessage"

type CTAButtonProps = ComponentPropsWithoutRef<typeof CTAButton>

interface ConfirmationModalProps {
  open: boolean
  title: ReactNode
  variant: "warning" | "info"
  messageTitle: ReactNode
  messageDescription: ReactNode
  onConfirm: () => void | Promise<void>
  confirmLabel: ReactNode
  onClose: () => void
  cancelLabel?: ReactNode
  onCancel?: () => void
  children?: ReactNode
  confirmButtonProps?: Omit<CTAButtonProps, "children" | "onClick" | "variant"> & {
    className?: string
  }
  cancelButtonProps?: Omit<CTAButtonProps, "children" | "onClick" | "variant"> & {
    className?: string
  }
  actionsClassName?: string
  messageClassName?: string
}

export default function ConfirmationModal({
  open,
  title,
  variant,
  messageTitle,
  messageDescription,
  onConfirm,
  confirmLabel,
  onClose,
  cancelLabel = "Annuler",
  onCancel,
  children,
  confirmButtonProps,
  cancelButtonProps,
  actionsClassName,
  messageClassName,
}: ConfirmationModalProps) {
  const {
    className: confirmClassName,
    keepWidthWhileLoading = true,
    loadingText = "En cours...",
    loading: confirmLoading = false,
    disabled: confirmDisabled,
    ...restConfirmButtonProps
  } = confirmButtonProps ?? {}

  const {
    className: cancelClassName,
    disabled: cancelDisabledFromProps,
    ...restCancelButtonProps
  } = cancelButtonProps ?? {}

  const isLoading = Boolean(confirmLoading)
  const confirmButtonDisabled = Boolean(confirmDisabled)
  const cancelDisabled = isLoading || Boolean(cancelDisabledFromProps)

  const handleCancel = () => {
    if (cancelDisabled) return
    onCancel?.()
    onClose()
  }

  const renderedTitle =
    typeof title === "string" ? (
      <div className="flex flex-col items-center gap-3">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21.5774 7.5C22.7321 5.5 25.2679 5.5 26.4226 7.5L43.7428 37.5C44.8975 39.5 43.6296 42 41.3202 42H6.6798C4.3704 42 3.10246 39.5 4.25716 37.5L21.5774 7.5Z"
            fill={variant === "warning" ? "#EF4F4E" : "#7069FA"}
          />
          <path d="M24 18V27" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="24" cy="33" r="2" fill="white" />
        </svg>
        <span>{title}</span>
      </div>
    ) : (
      title
    )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={renderedTitle}
      closeDisabled={isLoading}
      footer={
        <div className={clsx("flex justify-center gap-3 sm:gap-4 w-full", actionsClassName)}>
          <CTAButton
            variant="secondary"
            onClick={handleCancel}
            disabled={cancelDisabled}
            className={clsx(
              "flex-1 w-full sm:w-auto sm:flex-initial sm:min-w-[136px]",
              cancelClassName
            )}
            {...restCancelButtonProps}
          >
            {cancelLabel}
          </CTAButton>

          <CTAButton
            type="button"
            variant={variant === "warning" ? "danger" : "active"}
            onClick={onConfirm}
            loading={confirmLoading}
            loadingText={loadingText}
            keepWidthWhileLoading={keepWidthWhileLoading}
            disabled={confirmButtonDisabled}
            className={clsx("flex-1 w-full sm:w-auto sm:flex-initial sm:min-w-[136px]", confirmClassName)}
            {...restConfirmButtonProps}
          >
            {confirmLabel}
          </CTAButton>
        </div>
      }
    >
      <ModalMessage
        variant={variant}
        title={messageTitle}
        description={messageDescription}
        className={clsx("mb-6", messageClassName)}
      />
      {children}
    </Modal>
  )
}
