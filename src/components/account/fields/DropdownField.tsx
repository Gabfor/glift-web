'use client'

import clsx from "clsx"
import AdminDropdown from "@/app/admin/components/AdminDropdown"
import SuccessMsg from "./SuccessMsg"

type Option = { value: string; label: string; iconSrc?: string }

export type DropdownFieldProps = {
  label: string
  selected: string
  onSelect: (val: string) => void
  options: Option[]
  placeholder: string
  touched: boolean
  success?: string
  setTouched: (val: boolean) => void
  /**
   * Tailwind width class applied to the dropdown button. Defaults to `w-full`.
   */
  width?: string
  /**
   * Optional wrapper classes for the dropdown container.
   */
  containerClassName?: string
  /**
   * Controls whether the user can clear the current selection.
   * Defaults to `true` to keep the previous behaviour.
   */
  clearable?: boolean
  /**
   * Custom label for the "clear" button when `clearable` is enabled.
   */
  clearLabel?: string
  /**
   * Optional callback fired after the field has been cleared.
   */
  onClear?: () => void
  /**
   * Optional class to override the dropdown button border radius. Defaults to 5px radius.
   */
  buttonRoundedClassName?: string
  /**
   * Strategy for sorting options. Defaults to "label".
   */
  sortStrategy?: "label" | "month" | "year-desc" | "none"
}

export default function DropdownField({
  label,
  selected,
  onSelect,
  options,
  placeholder,
  touched,
  success,
  setTouched,
  width = "w-full",
  containerClassName,
  clearable = true,
  clearLabel = "Effacer",
  onClear,
  buttonRoundedClassName = "rounded-[5px]",
  sortStrategy,
}: DropdownFieldProps) {
  const hasSelection = selected !== ''
  const showSuccess = !!success && touched

  const buttonClassName = clsx(
    width,
    "h-[45px] px-[15px]",
    buttonRoundedClassName,
    "text-[16px] font-semibold bg-white text-[#3A416F]",
    "border transition-all duration-150",
    "focus:outline-none",
    showSuccess
      ? "!border-[#00D591]"
      : "border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]",
  )

  return (
    <div
      className={clsx(
        "flex flex-col text-left",
        containerClassName ?? "w-[368px]",
      )}
    >
      <div className="flex items-center justify-between mb-[6px]">
        <label className="text-[16px] font-bold text-[#3A416F]">{label}</label>
        {hasSelection && clearable && (
          <button
            type="button"
            onClick={() => {
              if (selected !== '') {
                onSelect('')
                setTouched(false)
                onClear?.()
              }
            }}
            className="text-[12px] text-[#7069FA] font-semibold hover:text-[#6660E4]"
          >
            {clearLabel}
          </button>
        )}
      </div>

      <div className="relative">
        <AdminDropdown
          label=""
          placeholder={placeholder}
          selected={selected}
          onSelect={(val) => {
            if (val !== selected) {
              onSelect(val)
              setTouched(true)
            }
          }}
          options={options}
          buttonClassName={buttonClassName}
          sortStrategy={sortStrategy}
        />
      </div>

      <div className="h-[20px] mt-[5px] text-[13px] font-medium">
        {showSuccess && <SuccessMsg>{success}</SuccessMsg>}
      </div>
    </div>
  )
}
