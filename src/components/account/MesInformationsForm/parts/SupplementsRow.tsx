'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import ToggleField from '@/components/account/fields/ToggleField'

type Props = {
  missing: boolean
  supplements: string
  changeAndTouch: (setter: (v: string) => void, key: any) => (v: string) => void
  latchedTouched: any
  markTouched: (key: any) => void
  success?: string
  // ✅ setter réel
  setSupplements: (v: string) => void
}

export default function SupplementsRow({
  missing, supplements, changeAndTouch, latchedTouched, markTouched, success, setSupplements
}: Props) {
  return (
    <FieldRow show={missing}>
      <ToggleField
        label="Prise de compléments alimentaires"
        value={supplements}
        options={['Oui', 'Non']}
        onChange={changeAndTouch(setSupplements, 'supplements')}
        touched={latchedTouched.supplements}
        setTouched={() => markTouched('supplements')}
        success={success}
        className="w-[246px]"
      />
    </FieldRow>
  )
}
