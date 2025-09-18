'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import ToggleField from '@/components/account/fields/ToggleField'
import { trainingPlaces } from '../constants'

type Props = {
  missing: boolean
  trainingPlace: string
  changeAndTouch: (setter: (v: string) => void, key: any) => (v: string) => void
  latchedTouched: any
  markTouched: (key: any) => void
  success?: string
  // ✅ setter réel
  setTrainingPlace: (v: string) => void
}

export default function TrainingPlaceRow({
  missing, trainingPlace, changeAndTouch, latchedTouched, markTouched, success, setTrainingPlace
}: Props) {
  return (
    <FieldRow show={missing}>
      <ToggleField
        label="Lieu d’entraînement"
        value={trainingPlace}
        options={[...trainingPlaces]}
        onChange={changeAndTouch(setTrainingPlace, 'trainingPlace')}
        touched={latchedTouched.trainingPlace}
        setTouched={() => markTouched('trainingPlace')}
        success={success}
      />
    </FieldRow>
  )
}
