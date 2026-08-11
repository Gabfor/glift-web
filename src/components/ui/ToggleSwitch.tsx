"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type ToggleSwitchProps = {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  ariaLabel?: string
  isAdmin?: boolean
}

export default function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  name,
  id,
  className,
  ariaLabel,
  isAdmin,
}: ToggleSwitchProps) {
  const pathname = usePathname()
  const isPageAdmin =
    isAdmin ??
    (pathname?.startsWith("/admin") ||
      (typeof window !== "undefined" && window.location.hostname.startsWith("admin.")) ||
      pathname?.startsWith("/program") ||
      pathname?.startsWith("/program-store") ||
      pathname?.startsWith("/offer-shop") ||
      pathname?.startsWith("/content-blog") ||
      pathname?.startsWith("/help") ||
      pathname?.startsWith("/users") ||
      pathname?.startsWith("/entrainements") ||
      pathname?.startsWith("/create-") ||
      pathname?.startsWith("/slider") ||
      pathname?.startsWith("/legal") ||
      pathname?.startsWith("/administrateurs") ||
      pathname?.startsWith("/auteurs") ||
      pathname?.startsWith("/settings"))

  return (
    <label
      className={cn(
        "switch",
        isPageAdmin && "switch-admin",
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
