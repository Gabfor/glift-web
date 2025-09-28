'use client'

import AdminDropdown from '@/app/admin/components/AdminDropdown'
import { useCallback } from 'react'
import SuccessMsg from './SuccessMsg'

const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: String(i + 1).padStart(2, '0'),
}))
const months = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
]
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 100 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

export default function BirthDateField({
  birthDay,
  birthMonth,
  birthYear,
  setBirthDay,
  setBirthMonth,
  setBirthYear,
  touched,
  setTouched,
  successMessage,
  initialBirthDay,
  initialBirthMonth,
  initialBirthYear,
}: {
  birthDay: string
  birthMonth: string
  birthYear: string
  setBirthDay: (val: string) => void
  setBirthMonth: (val: string) => void
  setBirthYear: (val: string) => void
  touched: { birthDay: boolean; birthMonth: boolean; birthYear: boolean }
  setTouched: (val: Partial<typeof touched>) => void
  successMessage: string
  initialBirthDay: string
  initialBirthMonth: string
  initialBirthYear: string
}) {
  const isFull = birthDay !== '' && birthMonth !== '' && birthYear !== ''
  const showSuccess = !!successMessage

  const handleReset = () => {
    setBirthDay('')
    setBirthMonth('')
    setBirthYear('')
    setTouched({ birthDay: true, birthMonth: true, birthYear: true })
  }

  const handleOpenDay = useCallback(() => {}, [])
  const handleOpenMonth = useCallback(() => {}, [])
  const handleOpenYear = useCallback(() => {}, [])

  return (
    <div className="w-[368px]">
      <div className="flex justify-between items-center mb-[5px]">
        <label className="text-[16px] text-[#3A416F] font-bold">Date de naissance</label>
        {isFull && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[12px] font-semibold text-[#7069FA] hover:text-[#6660E4] hover:no-underline"
          >
            Effacer
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="w-[88px]">
          <AdminDropdown
            label=""
            placeholder="Jour"
            options={days}
            selected={birthDay}
            onSelect={(val) => {
              setBirthDay(val)
              setTouched({ birthDay: true })
            }}
            onOpenChange={handleOpenDay}
            success={showSuccess && touched.birthDay && birthDay !== initialBirthDay}
          />
        </div>

        <div className="w-[154px]">
          <AdminDropdown
            label=""
            placeholder="Mois"
            options={months}
            selected={birthMonth}
            onSelect={(val) => {
              setBirthMonth(val)
              setTouched({ birthMonth: true })
            }}
            onOpenChange={handleOpenMonth}
            success={showSuccess && touched.birthMonth && birthMonth !== initialBirthMonth}
          />
        </div>

        <div className="w-[111px]">
          <AdminDropdown
            label=""
            placeholder="Année"
            options={years}
            selected={birthYear}
            onSelect={(val) => {
              setBirthYear(val)
              setTouched({ birthYear: true })
            }}
            onOpenChange={handleOpenYear}
            success={showSuccess && touched.birthYear && birthYear !== initialBirthYear}
          />
        </div>
      </div>

      <div className="h-[20px] mt-[5px] text-[13px] font-medium text-left">
        {showSuccess && <SuccessMsg>{successMessage}</SuccessMsg>}
      </div>
    </div>
  )
}
