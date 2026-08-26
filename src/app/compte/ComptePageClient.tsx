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

export interface ComptePageContent {
  surtitre?: string
  titre?: string
  description?: string
}

interface ComptePageClientProps {
  initialPaymentMethods: PaymentMethod[]
  initialIsPremium: boolean
  initialPageContent?: ComptePageContent
}

export default function ComptePageClient({ initialPaymentMethods, initialIsPremium, initialPageContent }: ComptePageClientProps) {
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
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[100px] md:pt-[140px]">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">
        {initialPageContent?.surtitre && (
          <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center w-full max-w-[500px] mx-auto">
            {initialPageContent.surtitre}
          </div>
        )}
        <h1
          className="text-[24px] sm:text-[32px] md:text-[30px] font-bold leading-snug text-[#2E3271] text-center w-full max-w-[500px] mx-auto mb-[10px] prose-titles [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: initialPageContent?.titre || "Bienvenue dans votre compte" }}
        />
        <div
          className="text-[16px] text-[#5D6494] font-semibold leading-relaxed w-full max-w-[500px] mx-auto mb-[40px] text-center [&_p]:m-0 [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
          dangerouslySetInnerHTML={{
            __html:
              initialPageContent?.description ||
              "Mettez à jour votre profil, modifiez vos informations ou votre abonnement.",
          }}
        />

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
