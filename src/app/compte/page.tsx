'use client'

import { useUser } from '@/context/UserContext'
import { Accordion } from '@/components/ui/accordion'
import MesInformationsSection from '@/components/account/sections/MesInformationsSection'
import MotDePasseSection from '@/components/account/sections/MotDePasseSection'
import AbonnementSection from '@/components/account/sections/AbonnementSection'
import PreferencesSection from '@/components/account/sections/PreferencesSection'
import DeleteAccountButtonWithModal from '@/components/DeleteAccountButtonWithModal'
import { useEffect, useState } from 'react'

export default function ComptePage() {
  const { user } = useUser()
  const [openSections, setOpenSections] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (hash) setOpenSections([hash])
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-[10px]">
          Bienvenue dans votre compte
        </h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug mb-[40px]">
          Mettez à jour votre profil, modifiez vos informations ou votre abonnement.
        </p>

        <div className="w-[760px] space-y-[30px]">
          <Accordion type="multiple" className="space-y-[30px]" value={openSections} onValueChange={setOpenSections}>
            <MesInformationsSection user={user} />
            <MotDePasseSection />
            <AbonnementSection />
            <PreferencesSection />
          </Accordion>
        </div>

        <DeleteAccountButtonWithModal triggerClassName="mt-[60px]" />
      </div>
    </main>
  )
}
