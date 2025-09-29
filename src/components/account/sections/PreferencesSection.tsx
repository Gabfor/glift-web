"use client"

import DeleteAccountButtonWithModal from "@/components/DeleteAccountButtonWithModal"
import AccountAccordionSection from "../AccountAccordionSection"

export default function PreferencesSection() {
  return (
    <AccountAccordionSection value="mes-preferences" title="Mes préférences">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-[14px] font-semibold leading-normal text-[#5D6494]">
          Bientôt, vous pourrez personnaliser vos préférences depuis cette rubrique.
        </p>

        <DeleteAccountButtonWithModal />
      </div>
    </AccountAccordionSection>
  )
}
