"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import clsx from "clsx"

import ChevronIcon from "/public/icons/chevron.svg"

export type DashboardExerciseDropdownOption = {
  value: string
  label: string
}

export type DashboardExerciseDropdownProps = {
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<DashboardExerciseDropdownOption>
  iconSrc: string
  iconHoverSrc: string
  className?: string
}

export default function DashboardExerciseDropdown({
  value,
  onChange,
  options,
  iconSrc,
  iconHoverSrc,
  className,
}: DashboardExerciseDropdownProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)
  const selectedLabel = selectedOption?.label ?? options[0]?.label ?? ""

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false)
        buttonRef.current?.blur()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className={clsx("relative", className)} ref={menuRef}>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="group flex items-center gap-[12px] text-[15px] font-semibold text-[#5D6494] hover:text-[#3A416F] transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="relative w-[18px] h-[18px]">
          <Image
            src={iconSrc}
            alt=""
            fill
            className={clsx(
              "object-contain transition-opacity duration-150",
              open ? "opacity-0" : "opacity-100 group-hover:opacity-0",
            )}
            aria-hidden
          />
          <Image
            src={iconHoverSrc}
            alt=""
            fill
            className={clsx(
              "object-contain absolute top-0 left-0 transition-opacity duration-150",
              open ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            aria-hidden
          />
        </span>
        <span className="whitespace-nowrap">{selectedLabel}</span>
        <span className="relative w-[10px] h-[6px]">
          <Image
            src={ChevronIcon}
            alt=""
            fill
            className="object-contain"
            style={{
              transform: open ? "rotate(-180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              transformOrigin: "center 45%",
            }}
            aria-hidden
          />
        </span>
      </button>

      {open ? (
        <div
          className="absolute -right-[23px] mt-2 min-w-[220px] bg-white rounded-[5px] shadow-[0px_5px_21px_0px_rgba(93,100,168,0.15)] py-2 z-50 border border-[#ECE9F1]"
        >
          <div className="absolute -top-2 right-[18px] w-4 h-4 bg-white rotate-45 border-t border-l border-[#ECE9F1] rounded-[1px]" />
          <div className="flex flex-col">
            {options.map((option) => {
              const isSelected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={clsx(
                    "text-[16px] text-left font-semibold py-[8px] px-2 mx-[10px] rounded-[5px] transition-colors",
                    isSelected
                      ? "text-[#7069FA]"
                      : "text-[#5D6494] hover:text-[#3A416F] hover:bg-[#FAFAFF]",
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
