'use client'

import SuccessMsg from './SuccessMsg'
import type { ReactNode } from 'react'

type Props = {
  label: string
  value: string
  onChange?: (val: string) => void
  onBlur?: () => void
  onFocus?: () => void
  disabled?: boolean
  success?: string
  error?: string
  endAdornment?: ReactNode
}

export default function TextField({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  success,
  error,
  endAdornment,
}: Props) {
  const showError = !!error
  const showSuccess = !!success && !showError

  return (
    <div className="w-[368px] flex flex-col text-left">
      <label className="text-[16px] font-bold text-[#3A416F] mb-[6px]">{label}</label>

      <div className="relative">
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onFocus={() => onFocus?.()}
          onBlur={() => onBlur?.()}
          className={`
            h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[8px]
            ${disabled ? 'bg-[#F2F1F6] text-[#D7D4DC] cursor-not-allowed' : 'bg-white text-[#3A416F]'}
            transition-all duration-150
            border
            ${showError
              ? 'border-[#EF4444] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#FCA5A5]'
              : showSuccess
              ? 'border-[#00D591]'
              : 'border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]'}
          `}
          placeholder={label}
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
        {showError ? (
          <p className="text-[#EF4444]">{error}</p>
        ) : showSuccess ? (
          <SuccessMsg>{success}</SuccessMsg>
        ) : null}
      </div>
    </div>
  )
}
