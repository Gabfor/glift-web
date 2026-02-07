'use client'

import { useUser } from '@/context/UserContext'
import { Accordion } from '@/components/ui/accordion'
import MesInformationsSection from '@/components/account/sections/MesInformationsSection'
import MotDePasseSection from '@/components/account/sections/MotDePasseSection'
import AbonnementSection from '@/components/account/sections/AbonnementSection'
import PreferencesSection from '@/components/account/sections/PreferencesSection'
import DeleteAccountButtonWithModal from '@/components/DeleteAccountButtonWithModal'
import { useCallback, useEffect, useState } from 'react'

import { PaymentMethod } from '@/lib/services/paymentService'

interface ComptePageClientProps {
  initialPaymentMethods: PaymentMethod[]
  initialIsPremium: boolean
}

export default function ComptePageClient({ initialPaymentMethods, initialIsPremium }: ComptePageClientProps) {
  const { user, isEmailVerified } = useUser()
  const [openSections, setOpenSections] = useState<string[]>([])

  const openSectionFromHash = useCallback(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash.replace('#', '')
    if (!hash) {
      return
    }

    setOpenSections((current) => {
      // If the section is already open, keep it open (and potentially others)
      if (current.includes(hash)) {
        return current
      }
      // Add the new section to the list of open sections to avoid layout shift
      // This solves the scroll issue when navigating from a higher open section
      return [...current, hash]
    })

    const target = document.getElementById(hash)
    if (target) {
      // Base offset 110px. Add 36px if email not verified (banner visible)
      // Check logic from Header.tsx: show if verified is false or (null AND not confirmed)
      const shouldShowBanner = isEmailVerified === false || (isEmailVerified === null && !user?.email_confirmed_at)
      const headerOffset = 110 + (shouldShowBanner ? 36 : 0)

      const { top } = target.getBoundingClientRect()
      const scrollTop = window.scrollY + top - headerOffset
      window.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
    }
  }, [isEmailVerified, user])

  useEffect(() => {
    openSectionFromHash()

    if (typeof window === 'undefined') {
      return
    }

    const handleHashChange = () => openSectionFromHash()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [openSectionFromHash])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (window.location.hash !== '#mes-informations') {
      return
    }

    const enforceStayOnPage = () => {
      window.history.pushState(null, '', window.location.href)
    }

    const handlePopState = () => {
      enforceStayOnPage()
    }

    enforceStayOnPage()

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
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

        <div className="w-full max-w-[760px] space-y-[30px]">
          <Accordion type="multiple" className="space-y-[30px]" value={openSections} onValueChange={setOpenSections}>
            <MesInformationsSection user={user} />
            <MotDePasseSection />
            <AbonnementSection initialPaymentMethods={initialPaymentMethods} initialIsPremium={initialIsPremium} />
            <PreferencesSection />
          </Accordion>
        </div>

        <DeleteAccountButtonWithModal triggerClassName="mt-[60px]" />
      </div>
    </main>
  )
}
