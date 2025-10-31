"use client"

import clsx from "clsx"

import CTAButton from "@/components/CTAButton"

type Props = {
  loading: boolean
  disabled: boolean
  label?: string
  onClick?: () => void
  containerClassName?: string
  buttonClassName?: string
}

export default function SubmitButton({
  loading,
  disabled,
  label = "Enregistrer mes informations",
  onClick,
  containerClassName,
  buttonClassName,
}: Props) {
  const isDisabled = disabled || loading

  return (
    <div
      className={clsx(
        "w-full flex justify-center mt-3 mb-8",
        containerClassName,
      )}
    >
      <CTAButton
        type="submit"
        onClick={onClick}
        disabled={isDisabled}
        loading={loading}
        variant={isDisabled ? "inactive" : "active"}
        className={clsx("font-semibold", buttonClassName)}
      >
        {label}
      </CTAButton>
    </div>
  )
}
