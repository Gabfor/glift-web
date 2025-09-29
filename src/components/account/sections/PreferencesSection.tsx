"use client"

import DeleteAccountButtonWithModal from "@/components/DeleteAccountButtonWithModal"
import AccountAccordionSection from "../AccountAccordionSection"

export default function PreferencesSection() {
  return (
    <AccountAccordionSection value="mes-preferences" title="Mes préférences">
      <p className="text-center text-[14px] font-semibold leading-normal text-[#5D6494]">
        Bientôt, vous pourrez personnaliser vos préférences depuis cette rubrique.
      </p>
        <DeleteAccountButtonWithModal />
    </AccountAccordionSection>
  )
}
