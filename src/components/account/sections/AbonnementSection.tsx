"use client"

import AccountAccordionSection from "../AccountAccordionSection"
import SubscriptionManager from "../SubscriptionManager"

export default function AbonnementSection() {
  return (
    <AccountAccordionSection value="mon-abonnement" title="Mon abonnement">
      <SubscriptionManager />
    </AccountAccordionSection>
  )
}
