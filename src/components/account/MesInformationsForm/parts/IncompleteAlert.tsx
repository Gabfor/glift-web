'use client'
import Image from 'next/image'
export default function IncompleteAlert() {
  return (
    <div className="w-[564px] max-w-full mt-4">
      <div className="relative bg-[#F4F5FE] rounded-[5px] px-5 py-2.5 text-left">
        <span className="absolute left-0 top-0 h-full w-[3px] bg-[#A1A5FD]" />
        <h3 className="text-[#7069FA] font-bold text-[12px]">Complétez votre profil</h3>
        <p className="text-[#A1A5FD] font-semibold text-[12px] leading-relaxed">
          Complétez les informations manquantes indiquées par un{' '}
          <span className="inline-flex items-center justify-center align-[-7px] w-[24px] h-[24px] rounded-full">
            <Image src="/icons/missing.svg" alt="" width={25} height={25} />
          </span>{' '}
          et personnalisez votre expérience avec Glift.
        </p>
      </div>
    </div>
  )
}
