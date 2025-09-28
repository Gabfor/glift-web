"use client"

import AccountAccordionSection from "../AccountAccordionSection"
import MesInformationsForm from "@/components/account/MesInformationsForm"
import type { User } from "@supabase/supabase-js"

export default function MesInformationsSection({ user }: { user: User | null }) {
  return (
    <AccountAccordionSection value="mes-informations" title="Mes informations">
      <MesInformationsForm user={user} />
    </AccountAccordionSection>
  )
}
