'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import DropdownField from '@/components/account/fields/DropdownField'
import { countries } from '../constants'

type Props = {
  missing: boolean
  country: string
  resetSuppress: () => void
  changeAndTouch: (setter: (v: string) => void, key: any) => (v: string) => void
  latchedTouched: any
  markTouched: (key: any) => void
  success?: string
  // ✅ setter réel à passer depuis le parent
  setCountry: (v: string) => void
}

export default function CountryRow({
  missing, country, resetSuppress, changeAndTouch, latchedTouched, markTouched, success, setCountry
}: Props) {
  return (
    <FieldRow show={missing} onMouseDown={resetSuppress}>
      <DropdownField
        label="Pays de résidence"
        placeholder="Sélectionnez un pays"
        selected={country}
        onSelect={changeAndTouch(setCountry, 'country')}
        options={countries.map((v) => ({ value: v, label: v }))}
        touched={latchedTouched.country}
        setTouched={(val) => val && markTouched('country')}
        success={success}
      />
    </FieldRow>
  )
}
