'use client'

type AddTrainingButtonProps = {
  onClick: () => void
}

export default function AddTrainingButton({ onClick }: AddTrainingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="border-[2px] border-dashed border-[#A1A5FD] text-[#A1A5FD] text-[16px] font-semibold px-5 py-2 rounded-[6px] w-[270px] h-[60px] hover:border-[#7069FA] hover:text-[#7069FA] transition"
    >
      + Ajouter un entraînement
    </button>
  )
}
