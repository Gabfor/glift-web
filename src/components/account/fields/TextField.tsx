'use client'

import clsx from 'clsx'
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
  placeholder?: string
  inputClassName?: string
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
  placeholder,
  inputClassName = 'rounded-[5px]',
}: Props) {
  const showError = !!error
  const showSuccess = !!success && !showError

  return (
    <div className="w-full max-w-[368px] flex flex-col text-left mx-auto">
      <div className="flex items-center gap-2 mb-[6px]">
        <label className="text-[16px] font-bold text-[#3A416F] w-fit self-start mb-0">{label}</label>
        {endAdornment && (
          <div className="relative w-[18px] h-[18px] flex items-center justify-center">
            {endAdornment}
          </div>
        )}
      </div>

      <div className="relative w-full">
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onFocus={() => onFocus?.()}
          onBlur={() => onBlur?.()}
          className={clsx(
            'h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px]',
            inputClassName,
            disabled
              ? 'bg-[#F2F1F6] text-[#D7D4DC] disabled:opacity-100 disabled:[-webkit-text-fill-color:#D7D4DC] cursor-not-allowed'
              : 'bg-white text-[#3A416F]',
            'transition-all duration-150',
            'border',
            showError
              ? 'border-[#EF4444] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#FCA5A5]'
              : showSuccess
              ? 'border-[#00D591] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]'
              : 'border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]',
          )}
          placeholder={placeholder ?? label}
        />
      </div>

      <div className="min-h-[20px] mt-[5px] text-[13px] font-medium leading-snug">
        {showError ? (
          <p className="text-[#EF4444]">{error}</p>
        ) : showSuccess ? (
          <SuccessMsg>{success}</SuccessMsg>
        ) : null}
      </div>
    </div>
  )
}
