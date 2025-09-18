'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import ToggleField from '@/components/account/fields/ToggleField'

type Props = {
  missing: boolean
  weeklySessions: string
  changeAndTouch: (setter: (v: string) => void, key: any) => (v: string) => void
  latchedTouched: any
  markTouched: (key: any) => void
  success?: string
  // ✅ setter réel
  setWeeklySessions: (v: string) => void
}

export default function WeeklySessionsRow({
  missing, weeklySessions, changeAndTouch, latchedTouched, markTouched, success, setWeeklySessions
}: Props) {
  return (
    <FieldRow show={missing}>
      <ToggleField
        label="Nombre de sessions par semaine"
        value={weeklySessions}
        options={['1', '2', '3', '4', '5', '6+']}
        onChange={changeAndTouch(setWeeklySessions, 'weeklySessions')}
        touched={latchedTouched.weeklySessions}
        setTouched={() => markTouched('weeklySessions')}
        success={success}
        variant="boxed"
        className="w-[368px]"
        itemClassName="w-[53px] h-[45px]"
      />
    </FieldRow>
  )
}
