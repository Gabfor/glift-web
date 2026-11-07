"use client"

import { useState, useEffect } from "react"
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
  const [mountedAdmin, setMountedAdmin] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname.startsWith("admin.")) {
      setMountedAdmin(true)
    }
  }, [])

  const isPageAdmin =
    isAdmin ??
    (pathname?.startsWith("/admin") ||
      mountedAdmin ||
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
      pathname?.startsWith("/sonneries") ||
      pathname?.startsWith("/settings"))

  return (
    <label
      className={cn(
        "switch",
        isPageAdmin && "switch-admin",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
      />
      <span className="slider" />
    </label>
  )
}
