'use client'

import AccountAccordionSection from '../AccountAccordionSection'
import MesInformationsForm from '@/components/account/MesInformationsForm'

export const SECTION_ID = 'mes-informations'

export default function MesInformationsSection({ user }: { user: any }) {
  return (
    <AccountAccordionSection value={SECTION_ID} title="Mes informations">
      <MesInformationsForm user={user} />
    </AccountAccordionSection>
  )
}
