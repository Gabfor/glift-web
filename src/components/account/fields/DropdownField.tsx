'use client'

import AdminDropdown from '@/app/admin/components/AdminDropdown'
import SuccessMsg from './SuccessMsg'
import type { ReactNode } from 'react'

type Option = { value: string; label: string; iconSrc?: string }

type Props = {
  label: string
  selected: string
  onSelect: (val: string) => void
  options: Option[]
  placeholder: string
  touched: boolean
  success?: string
  setTouched: (val: boolean) => void
  width?: string
  endAdornment?: ReactNode
  clearable?: boolean
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
  width = 'w-full',
  endAdornment,
  clearable = true,
}: Props) {
  const hasSelection = selected !== ''
  const showSuccess = !!success && touched

  const buttonClassName = `
    ${width} h-[45px] rounded-[5px] px-[15px]
    text-[16px] font-semibold bg-white text-[#3A416F]
    border transition-all duration-150
    focus:outline-none
    ${
      showSuccess
        ? '!border-[#00D591]'
        : 'border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]'
    }
  `

  return (
    <div className="w-[368px] flex flex-col text-left">
      <div className="flex items-center justify-between mb-[6px]">
        <label className="text-[16px] font-bold text-[#3A416F]">{label}</label>
        {hasSelection && clearable && (
          <button
            type="button"
            onClick={() => {
              if (selected !== '') {
                onSelect('')
                setTouched(false)
              }
            }}
            className="text-[12px] text-[#7069FA] font-semibold hover:text-[#6660E4]"
          >
            Effacer
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
        />

        {endAdornment && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ left: 'calc(100% + 10px)' }}
          >
            <div className="relative w-[18px] h-[18px] pointer-events-auto flex items-center justify-center">
              {endAdornment}
            </div>
          </div>
        )}
      </div>

      <div className="h-[20px] mt-[5px] text-[13px] font-medium">
        {showSuccess && <SuccessMsg>{success}</SuccessMsg>}
      </div>
    </div>
  )
}
