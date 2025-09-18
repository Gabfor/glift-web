'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import ToggleField from '@/components/account/fields/ToggleField'

type Props = {
  missing: boolean
  experience: string
  changeAndTouch: (setter: (v: string) => void, key: any) => (v: string) => void
  latchedTouched: any
  markTouched: (key: any) => void
  success?: string
  // ✅ setter réel
  setExperience: (v: string) => void
}

export default function ExperienceRow({
  missing, experience, changeAndTouch, latchedTouched, markTouched, success, setExperience
}: Props) {
  return (
    <FieldRow show={missing}>
      <ToggleField
        label="Années de pratique"
        value={experience}
        options={['0', '1', '2', '3', '4', '5+']}
        onChange={changeAndTouch(setExperience, 'experience')}
        touched={latchedTouched.experience}
        setTouched={() => markTouched('experience')}
        success={success}
        variant="boxed"
        className="w-[368px]"
        itemClassName="w-[53px] h-[45px]"
      />
    </FieldRow>
  )
}
