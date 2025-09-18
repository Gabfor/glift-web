'use client'
import SubmitButton from '@/components/account/fields/SubmitButton'
type Props = {
  submitting: boolean
  submitLoading: boolean
  hasChanges: boolean
  clearSuccessAndBorders: () => void
}
export default function SubmitBar({ submitting, submitLoading, hasChanges, clearSuccessAndBorders }: Props) {
  return (
    <SubmitButton
      loading={submitting || submitLoading}
      disabled={!hasChanges || submitting || submitLoading}
      onClick={clearSuccessAndBorders}
    />
  )
}
