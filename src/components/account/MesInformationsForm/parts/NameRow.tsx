'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import TextField from '@/components/account/fields/TextField'

type Props = {
  missing: boolean
  name: string
  resetSuppress: () => void
  setName: (v: string) => void
  // ↓ tolérant
  markTouched: (key: any) => void
  setIsEditingName: (v: boolean) => void
  setTouched: (updater: any) => void
  success?: string
}

export default function NameRow({
  missing, name, resetSuppress, setName, markTouched, setIsEditingName, setTouched, success
}: Props) {
  return (
    <FieldRow show={missing}>
      <TextField
        label="Prénom"
        value={name}
        onChange={(v) => {
          resetSuppress()
          setName(v)
        }}
        onBlur={() => {
          markTouched('name')
          setIsEditingName(false)
        }}
        onFocus={() => {
          setIsEditingName(true)
          setTouched((t: any) => ({ ...t, name: false }))
        }}
        success={success}
      />
    </FieldRow>
  )
}
