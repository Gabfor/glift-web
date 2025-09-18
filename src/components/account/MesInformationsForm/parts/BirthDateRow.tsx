'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import BirthDateField from '@/components/account/fields/BirthDateField'

type Props = {
  missing: boolean
  birthDay: string
  birthMonth: string
  birthYear: string
  setBirthDay: (v: string) => void
  setBirthMonth: (v: string) => void
  setBirthYear: (v: string) => void
  // ↓ tolérant sur la clé
  changeAndTouch: (setter: (v: string) => void, key: any) => (v: string) => void
  resetSuppress: () => void
  setTouched: (updater: any) => void
  latchedTouched: any
  successMessage: string
  initialBirthDay: string
  initialBirthMonth: string
  initialBirthYear: string
}

export default function BirthDateRow({
  missing,
  birthDay,
  birthMonth,
  birthYear,
  setBirthDay,
  setBirthMonth,
  setBirthYear,
  changeAndTouch,
  resetSuppress,
  setTouched,
  latchedTouched,
  successMessage,
  initialBirthDay,
  initialBirthMonth,
  initialBirthYear,
}: Props) {
  return (
    <FieldRow show={missing}>
      <BirthDateField
        birthDay={birthDay}
        birthMonth={birthMonth}
        birthYear={birthYear}
        setBirthDay={changeAndTouch(setBirthDay, 'birthDay')}
        setBirthMonth={changeAndTouch(setBirthMonth, 'birthMonth')}
        setBirthYear={changeAndTouch(setBirthYear, 'birthYear')}
        touched={{
          birthDay: latchedTouched.birthDay,
          birthMonth: latchedTouched.birthMonth,
          birthYear: latchedTouched.birthYear,
        }}
        setTouched={(partial) => {
          resetSuppress()
          setTouched((t: any) => ({
            ...t,
            ...(partial.birthDay !== undefined && { birthDay: partial.birthDay }),
            ...(partial.birthMonth !== undefined && { birthMonth: partial.birthMonth }),
            ...(partial.birthYear !== undefined && { birthYear: partial.birthYear }),
          }))
        }}
        successMessage={successMessage}
        initialBirthDay={initialBirthDay}
        initialBirthMonth={initialBirthMonth}
        initialBirthYear={initialBirthYear}
      />
    </FieldRow>
  )
}
