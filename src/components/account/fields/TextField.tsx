'use client'

import SuccessMsg from './SuccessMsg'

type Props = {
  label: string
  value: string
  onChange?: (val: string) => void
  onBlur?: () => void
  onFocus?: () => void
  disabled?: boolean
  success?: string
}

export default function TextField({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  success,
}: Props) {
  const showSuccess = !!success

  return (
    <div className="w-[368px] flex flex-col text-left">
      <label className="text-[16px] font-bold text-[#3A416F] mb-[6px]">{label}</label>

      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onFocus={(e) => onFocus?.()}
        onBlur={(e) => onBlur?.()}
        className={`
          h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px]
          ${disabled ? 'bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed' : 'bg-white text-[#3A416F]'}
          transition-all duration-150
          border
          ${success
            ? 'border-[#00D591]'
            : 'border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]'}
        `}
        placeholder={label}
      />

      <div className="h-[20px] mt-[5px] text-[13px] font-medium">
        {showSuccess && <SuccessMsg>{success}</SuccessMsg>}
      </div>
    </div>
  )
}