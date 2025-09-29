"use client"

import clsx from "clsx"
import { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react"
import CTAButton from "@/components/CTAButton"
import Modal from "@/components/ui/Modal"
import ModalMessage from "@/components/ui/ModalMessage"

type CTAButtonProps = ComponentPropsWithoutRef<typeof CTAButton>

interface ConfirmationModalProps {
  open: boolean
  title: string
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
  cancelButtonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick"> & {
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      closeDisabled={isLoading}
      footer={
        <div className={clsx("flex justify-center gap-4", actionsClassName)}>
          <button
            type="button"
            onClick={handleCancel}
            aria-disabled={cancelDisabled}
            className={clsx(
              "px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]",
              cancelDisabled && "pointer-events-none",
              cancelClassName
            )}
            {...restCancelButtonProps}
          >
            {cancelLabel}
          </button>

          <CTAButton
            type="button"
            variant={variant === "warning" ? "danger" : "active"}
            onClick={onConfirm}
            loading={confirmLoading}
            loadingText={loadingText}
            keepWidthWhileLoading={keepWidthWhileLoading}
            disabled={confirmButtonDisabled}
            className={clsx("min-w-[136px]", confirmClassName)}
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
