'use client'

import Image from 'next/image'

interface Training {
  id: string
  name: string
  app: boolean
  dashboard: boolean
}

interface VisibilityPanelProps {
  training: Training
  onClose: () => void
  onUpdateVisibility: (updates: Partial<{ app: boolean; dashboard: boolean }>) => Promise<void>
}

export default function VisibilityPanel({ training, onClose, onUpdateVisibility }: VisibilityPanelProps) {
  return (
    <div className="bg-white p-4 border mt-[-1px] w-[270px] rounded-b-[5px] rounded-t-none">
      <div className="flex justify-between items-center mb-4">
        <div className="text-[16px] font-semibold text-[#3A416F]">Visibilité</div>
        <button onClick={onClose} className="relative w-[24px] h-[24px]">
          <Image
            src="/icons/close.svg"
            alt="Fermer"
            fill
            sizes="100%"
            className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
          />
          <Image
            src="/icons/close_hover.svg"
            alt="Fermer (hover)"
            fill
            sizes="100%"
            className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
          />
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-[16px] font-semibold text-[#5D6494]">Application mobile</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={!!training.app}
            onChange={async () => {
              await onUpdateVisibility({ app: !training.app })
            }}
          />
          <span className="slider round" />
        </label>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[16px] font-semibold text-[#5D6494]">Dashboard</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={!!training.dashboard}
            onChange={async () => {
              await onUpdateVisibility({ dashboard: !training.dashboard })
            }}
          />
          <span className="slider round" />
        </label>
      </div>
    </div>
  )
}
