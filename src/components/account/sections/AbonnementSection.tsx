import { PaymentMethod } from "@/lib/services/paymentService"
import AccountAccordionSection from "../AccountAccordionSection"
import SubscriptionManager from "../SubscriptionManager"

interface AbonnementSectionProps {
  initialPaymentMethods?: PaymentMethod[]
  initialIsPremium: boolean
}

export default function AbonnementSection({ initialPaymentMethods, initialIsPremium }: AbonnementSectionProps) {
  return (
    <AccountAccordionSection value="mon-abonnement" title="Mon abonnement">
      <SubscriptionManager initialPaymentMethods={initialPaymentMethods} initialIsPremium={initialIsPremium} />
    </AccountAccordionSection>
  )
}
