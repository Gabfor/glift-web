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
  const [openSection, setOpenSection] = useState<string>("")

  const scrollToSection = useCallback((sectionId: string, smooth = true) => {
    if (typeof window === 'undefined' || !sectionId) return

    const performScroll = (isSmooth: boolean) => {
      const el = document.getElementById(sectionId)
      if (!el) return

      // Dynamically calculate the total height of the fixed header (including any active top banners)
      const fixedHeader = document.querySelector('.fixed.top-0') as HTMLElement | null
      const headerHeight = fixedHeader ? fixedHeader.getBoundingClientRect().height : 72
      // Responsive buffer: 12px on mobile screens, 20px on desktop
      const buffer = window.innerWidth < 768 ? 12 : 20
      const headerOffset = headerHeight + buffer

      const rect = el.getBoundingClientRect()
      const targetScrollTop = window.scrollY + rect.top - headerOffset

      window.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: isSmooth ? 'smooth' : 'auto',
      })
    }

    // Smoothly scroll and maintain alignment through accordion open/close transition (300ms duration)
    performScroll(smooth)
    setTimeout(() => performScroll(smooth), 120)
    setTimeout(() => performScroll(smooth), 320)
    setTimeout(() => performScroll(false), 450)
  }, [])

  const handleSectionChange = useCallback((value: string) => {
    setOpenSection(value)
    if (typeof window !== 'undefined') {
      if (value) {
        window.history.replaceState(null, '', `#${value}`)
        setTimeout(() => {
          scrollToSection(value, true)
        }, 120)
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
  }, [scrollToSection])

  const openSectionFromHash = useCallback((smooth = true) => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash.replace('#', '')
    if (!hash) {
      return
    }

    setOpenSection(hash)
    setTimeout(() => {
      scrollToSection(hash, smooth)
    }, 150)
  }, [scrollToSection])

  useEffect(() => {
    openSectionFromHash(false)

    if (typeof window === 'undefined') {
      return
    }

    const handleHashChange = () => openSectionFromHash(true)
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
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[100px] md:pt-[140px] overflow-x-hidden">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center w-full">
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
          <Accordion type="single" collapsible className="space-y-[30px]" value={openSection} onValueChange={handleSectionChange}>
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
