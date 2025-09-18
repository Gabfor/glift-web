'use client'
import FieldRow from '@/components/account/fields/FieldRow'
import TextField from '@/components/account/fields/TextField'
import EmailInfoAdornment from '@/components/account/fields/EmailInfoAdornment'

type Props = { missing: boolean; email: string }

export default function EmailRow({ missing, email }: Props) {
  return (
    <FieldRow show={missing}>
      <TextField
        label="Email"
        value={email}
        disabled
        endAdornment={<EmailInfoAdornment message="Pour des raisons techniques, votre email ne peut pas être modifié." />}
      />
    </FieldRow>
  )
}
