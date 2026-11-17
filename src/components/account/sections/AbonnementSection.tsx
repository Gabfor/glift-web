import { PaymentMethod } from "@/lib/services/paymentService"
import AccountAccordionSection from "../AccountAccordionSection"
import SubscriptionManager from "../SubscriptionManager"
import { SiteSettings } from "@/hooks/useSiteSettings"

interface AbonnementSectionProps {
  initialPaymentMethods?: PaymentMethod[]
  initialIsPremium: boolean
  initialSettings?: Partial<SiteSettings>
  initialSubscriptionDetails?: any
}

export default function AbonnementSection({ initialPaymentMethods, initialIsPremium, initialSettings, initialSubscriptionDetails }: AbonnementSectionProps) {
  return (
    <AccountAccordionSection value="mon-abonnement" title="Mon abonnement">
      <SubscriptionManager initialPaymentMethods={initialPaymentMethods} initialIsPremium={initialIsPremium} initialSettings={initialSettings} initialSubscriptionDetails={initialSubscriptionDetails} />
    </AccountAccordionSection>
  )
}
