'use client'

import AccountAccordionSection from '../AccountAccordionSection'
import MesInformationsForm from '@/components/account/MesInformationsForm'

export default function MesInformationsSection({ user }: { user: any }) {
  return (
    <AccountAccordionSection value="mes-informations" title="Mes informations">
      <MesInformationsForm user={user} />
    </AccountAccordionSection>
  )
}
