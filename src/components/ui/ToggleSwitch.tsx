"use client"

import { cn } from "@/lib/utils"

type ToggleSwitchProps = {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  ariaLabel?: string
}

export default function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  name,
  id,
  className,
  ariaLabel,
}: ToggleSwitchProps) {
  return (
    <label
      className={cn(
        "switch",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        name={name}
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        aria-label={ariaLabel}
      />
      <span className="slider round" />
    </label>
  )
}
