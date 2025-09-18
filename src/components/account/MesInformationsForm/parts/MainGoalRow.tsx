'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import DropdownField from '@/components/account/fields/DropdownField'
import { goals } from '../constants'

type Props = {
  missing: boolean
  mainGoal: string
  resetSuppress: () => void
  changeAndTouch: (setter: (v: string) => void, key: any) => (v: string) => void
  latchedTouched: any
  markTouched: (key: any) => void
  success?: string
  // ✅ setter réel
  setMainGoal: (v: string) => void
}

export default function MainGoalRow({
  missing, mainGoal, resetSuppress, changeAndTouch, latchedTouched, markTouched, success, setMainGoal
}: Props) {
  return (
    <FieldRow show={missing} onMouseDown={resetSuppress}>
      <DropdownField
        label="Objectif principal"
        placeholder="Sélectionnez un objectif"
        selected={mainGoal}
        onSelect={changeAndTouch(setMainGoal, 'mainGoal')}
        options={goals.map((v) => ({ value: v, label: v }))}
        touched={latchedTouched.mainGoal}
        setTouched={(val) => val && markTouched('mainGoal')}
        success={success}
      />
    </FieldRow>
  )
}
