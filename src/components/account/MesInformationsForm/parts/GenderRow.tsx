'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import ToggleField from '@/components/account/fields/ToggleField'

type Props = {
  missing: boolean
  gender: string
  resetSuppress: () => void
  setGender: (v: string) => void
  // ↓ tolérant
  markTouched: (key: any) => void
  latchedTouched: any
  success?: string
}

export default function GenderRow({
  missing, gender, resetSuppress, setGender, markTouched, latchedTouched, success
}: Props) {
  return (
    <FieldRow show={missing}>
      <ToggleField
        label="Sexe"
        value={gender}
        options={['Homme', 'Femme', 'Non binaire']}
        onChange={(v) => {
          resetSuppress()
          setGender(gender === v ? '' : v)
          markTouched('gender')
        }}
        touched={latchedTouched.gender}
        setTouched={() => markTouched('gender')}
        success={success}
      />
    </FieldRow>
  )
}
