import { useUser } from "@/context/UserContext";
import CTAButton from "@/components/CTAButton";
import Tooltip from "@/components/Tooltip";
import { useEffect, useState, useRef } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import ModalMessage from "@/components/ui/ModalMessage";
import { PaymentMethod } from "@/lib/services/paymentService";


import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "@/components/stripe/CheckoutForm";

// Initialize Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PlanOption = ({
    title,
    subtitle,
    price,
    period,
    isSelected,
    onSelect,
    badge,
}: {
    title: string;
    subtitle: string;
    price: string;
    period: string;
    isSelected: boolean;
    onSelect: () => void;
    badge?: React.ReactNode;
}) => {
    return (
        <div
            onClick={onSelect}
            className={`flex flex-col cursor-pointer group ${badge ? 'pt-0 pb-2' : 'py-2'}`}
        >
            {badge && (
                <div className="mb-1 ml-8">
                    {badge}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                        <img
                            src={isSelected ? "/icons/radio_ON.svg" : "/icons/radio_OFF.svg"}
                            alt={isSelected ? "Selected" : "Not selected"}
                            className="w-full h-full"
                        />
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-1">
                        <span className={`text-[16px] font-semibold leading-none ${isSelected ? "text-[#3A416F]" : "text-[#D7D4DC]"}`}>
                            {title}
                        </span>
                        <span className={`text-[16px] font-semibold leading-none ${isSelected ? "text-[#3A416F]" : "text-[#D7D4DC]"}`}>
                            {subtitle}
                        </span>
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span
                        className={`text-[20px] font-bold ${isSelected ? "text-[#2E3271]" : "text-[#D7D4DC]"
                            }`}
                    >
                        {price}
                    </span>
                    <span
                        className={`text-[16px] font-medium ${isSelected ? "text-[#5D6494]" : "text-[#D7D4DC]"
                            }`}
                    >
                        {period}
                    </span>
                </div>
            </div>
        </div>
    );
};
const PaymentMethodCard = ({
    brand,
    last4,
    expMonth,
    expYear,
    onEdit,
    onDelete,
    error // New prop for external errors
}: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    onEdit: () => void;
    onDelete: () => void;
    error?: string | null;
}) => {
    // Check for expiry
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    const isExpired = expYear < currentYear || (expYear === currentYear && expMonth < currentMonth);
    const isError = isExpired || !!error;

    // Basic mapping for brand icons
    const getBrandIcon = (brandName: string) => {
        const name = brandName.toLowerCase();
        if (name === 'visa') return '/icons/visa.svg';
        if (name === 'mastercard') return '/icons/mastercard.svg';
        if (name === 'amex') return '/icons/amex.svg';
        if (name === 'cb') return '/icons/cb.svg';
        return null;
    };

    const brandIcon = getBrandIcon(brand);

    return (
        <div className={`w-full h-[80px] rounded-[8px] bg-[#FAFAFF] border flex items-center justify-between px-[20px] ${isError ? 'border-red-500 bg-[#FFF1F1]' : 'border-[#E6E6FF]'}`}>
            <div className="flex items-center gap-4">
                <div className="w-[50px] h-[34px] flex items-center justify-center overflow-hidden">
                    {brandIcon ? (
                        <img src={brandIcon} alt={brand} className="h-[25px] w-auto object-contain" />
                    ) : (
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{brand}</span>
                    )}
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[14px] font-semibold text-[#2E3271]">
                        {brand.charAt(0).toUpperCase() + brand.slice(1)} qui se termine par {last4}
                    </span>
                    <span className={`text-[12px] font-semibold ${isExpired ? 'text-red-500' : 'text-[#5D6494]'}`}>
                        {isExpired ? "Expirée depuis" : "Expire en"} : {expMonth.toString().padStart(2, '0')}/{expYear}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onEdit}
                    type="button"
                    className="text-[14px] font-semibold text-[#7069FA] hover:text-[#5a52cc] transition-colors"
                >
                    Modifier
                </button>
                <Tooltip content="Supprimer">
                    <button
                        onClick={onDelete}
                        type="button"
                        className="group w-[20px] h-[20px] relative flex items-center justify-center transition-colors"
                    >
                        <img
                            src="/icons/delete_grey.svg"
                            alt="Supprimer"
                            className="absolute inset-0 w-full h-full object-contain group-hover:opacity-0 transition-opacity duration-200"
                        />
                        <img
                            src="/icons/delete_grey_hover.svg"
                            alt="Supprimer"
                            className="absolute inset-0 w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        />
                    </button>
                </Tooltip>
            </div>
        </div>
    )
}

const getPaymentErrorMessage = (code: string | null): string => {
    switch (code) {
        case 'insufficient_funds':
            return "Le paiement a été refusé par votre banque (fonds insuffisants).";
        case 'lost_card':
        case 'stolen_card':
            return "Cette carte a été déclarée perdue ou volée. Veuillez utiliser un autre moyen de paiement.";
        case 'expired_card':
            return "Votre carte a expiré. Veuillez mettre à jour votre moyen de paiement.";
        case 'incorrect_cvc':
            return "Le code de sécurité (CVC) est incorrect.";
        case 'processing_error':
            return "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.";
        case 'card_declined':
            return "Votre carte a été refusée. Veuillez contacter votre banque ou essayer une autre carte.";
        case 'authentication_required':
            return "L'authentification de votre banque a échoué. Veuillez réessayer.";
        default:
            return "Le dernier paiement a échoué. Veuillez vérifier votre moyen de paiement.";
    }
};


interface SubscriptionManagerProps {
    initialPaymentMethods?: PaymentMethod[];
    initialIsPremium?: boolean; // Optional because it might not be provided in all usages
}

export default function SubscriptionManager({ initialPaymentMethods, initialIsPremium = false }: SubscriptionManagerProps) {
    const { isPremiumUser, isLoading, refreshUser, premiumTrialEndAt, premiumEndAt, trial } = useUser();

    // Initialize with server-side value if available, or default to starter
    const [selectedPlan, setSelectedPlan] = useState<"starter" | "premium">(() => {
        return initialIsPremium ? "premium" : "starter";
    });

    const [loading, setLoading] = useState(false);
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(initialPaymentMethods?.[0] || null);

    // New state for inline form
    const [isAddingMethod, setIsAddingMethod] = useState(false);
    const [closeHovered, setCloseHovered] = useState(false);
    const [setupData, setSetupData] = useState<{ clientSecret: string; customerId: string; subscriptionId: string; plan: string; mode?: 'setup' | 'payment' } | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState<{ title: string; description: string; variant: 'success' | 'error' | 'info' | 'warning' }>({
        title: "",
        description: "",
        variant: "success"
    });

    const [successPlan, setSuccessPlan] = useState<'premium' | 'starter' | null>(null);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState<number | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentErrorCode, setPaymentErrorCode] = useState<string | null>(null);

    const fetchPaymentMethod = async () => {
        try {
            console.log("Fetching payment methods...");
            const res = await fetch('/api/user/payment-methods');
            if (res.ok) {
                const json = await res.json();
                if (json.data && json.data.length > 0) {
                    setPaymentMethod(json.data[0]);
                    setIsAddingMethod(false); // Close form on success
                } else {
                    setPaymentMethod(null);
                }
            }
        } catch (err) {
            console.error("Failed to fetch payment methods", err);
        }
    };

    const handleStartSetup = async () => {
        setIsAddingMethod(true);
        try {
            const res = await fetch('/api/user/setup-subscription', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setSetupData(data);
            }
        } catch (e) {
            console.error("Setup error", e);
            setIsAddingMethod(false);
        }
    };

    // Sync state with user profile when loaded client-side (reconciliation)
    // Sync state with user profile when loaded client-side (reconciliation)
    useEffect(() => {
        if (!isLoading) {
            // Guard against race condition: if we just successfully upgraded (successPlan is set),
            // do NOT revert to 'starter' even if isPremiumUser (context) is stale.
            if (successPlan === 'premium') {
                setSelectedPlan('premium');
                return;
            }
            setSelectedPlan(isPremiumUser ? "premium" : "starter");
        }
    }, [isPremiumUser, isLoading, successPlan]);

    useEffect(() => {
        if (isPremiumUser) {
            fetchPaymentMethod();

            // Check local state immediately to show message on reload
            const now = new Date();
            if (premiumEndAt && new Date(premiumEndAt) > now) {
                setSuccessPlan('starter');
                setSubscriptionEndDate(Math.floor(new Date(premiumEndAt).getTime() / 1000));
                setShowSuccessMessage(true);
            }

            // Fetch subscription details to check for pending cancellation
            fetch(`/api/user/subscription-details?t=${Date.now()}`)
                .then(res => res.json())
                .then(data => {
                    if (Date.now() - lastActionTime.current < 5000) return;

                    // Handle Payment Errors
                    if (data && (data.lastInvoiceErrorCode || data.lastInvoiceError)) {
                        const errorMessage = data.lastInvoiceErrorCode
                            ? getPaymentErrorMessage(data.lastInvoiceErrorCode)
                            : (data.lastInvoiceError || "Erreur de paiement inconnue");

                        setPaymentError(errorMessage);
                        setPaymentErrorCode(data.lastInvoiceErrorCode || null);

                        // Show global message only if significantly past due or recent error?
                        // Let's show it if status is past_due or incomplete
                        if (data.status === 'past_due' || data.status === 'incomplete') {
                            // Global error message handled by useEffect depending on expiry/error
                        }
                    } else {
                        setPaymentError(null);
                        setPaymentErrorCode(null);
                    }

                    console.log("Subscription details fetched:", data);

                    const now = new Date();
                    const hasFutureTrialEnd = premiumTrialEndAt && new Date(premiumTrialEndAt) > now;
                    const hasFuturePremiumEnd = premiumEndAt && new Date(premiumEndAt) > now;

                    if (data && data.status) {
                        // User has a Stripe subscription
                        if (data.cancel_at_period_end || hasFuturePremiumEnd || data.status === 'incomplete') {
                            // Cancellation pending (Stripe or DB) OR Incomplete subscription (Payment Failed/Abandoned)
                            setSuccessPlan('starter');
                            // Show end of current period
                            if (data.current_period_end) {
                                setSubscriptionEndDate(data.current_period_end);
                            } else if (hasFuturePremiumEnd) {
                                setSubscriptionEndDate(Math.floor(new Date(premiumEndAt!).getTime() / 1000));
                            } else {
                                // For incomplete, maybe show "now"? or let it be blank/default
                                // If incomplete, it means they are not effectively paid, so it will end "now" or "soon".
                                // If we don't set a date, the message might look weird if it depends on it.
                                // Let's try to set it to now to indicate immediate expiry.
                                setSubscriptionEndDate(Math.floor(Date.now() / 1000));
                            }
                            setShowSuccessMessage(true);
                        } else {
                            // Active Stripe subscription (auto-renews) AND NO local cancellation date
                            setShowSuccessMessage(false);
                            setSuccessPlan(null);
                        }
                    } else {
                        // NO Stripe subscription (or error)
                        // Fallback to manual/local checks
                        if (hasFuturePremiumEnd) {
                            // User cancelled manually (e.g. removed payment method or admin action)
                            setSuccessPlan('starter');
                            setSubscriptionEndDate(Math.floor(new Date(premiumEndAt!).getTime() / 1000));
                            setShowSuccessMessage(true);
                        } else if (hasFutureTrialEnd) {
                            // Manual trial without Stripe sub -> will expire
                            setSuccessPlan('starter');
                            setSubscriptionEndDate(Math.floor(new Date(premiumTrialEndAt!).getTime() / 1000));
                            setShowSuccessMessage(true);
                        }
                    }
                })
                .catch(err => console.error("Failed to fetch sub details", err));
        }
    }, [isPremiumUser, premiumTrialEndAt, premiumEndAt]);


    // Determine effective premium status: use server prop if not yet synced
    // SIMPLIFICATION: We trust context after mount.
    const effectiveIsPremium = isPremiumUser;
    // const effectiveIsPremium = true; // SIMULATION: FORCE VALID PREMIUM

    // Check for expiry locally
    useEffect(() => {
        if (paymentMethod) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const isLocalExpired = paymentMethod.exp_year < currentYear || (paymentMethod.exp_year === currentYear && paymentMethod.exp_month < currentMonth);
            const isExpired = isLocalExpired || paymentErrorCode === 'expired_card';

            if (isExpired) {
                setSuccessMessage({
                    title: "Mode de paiement expiré",
                    description: "Pour continuer à bénéficier d’un abonnement Premium veuillez renseigner un nouveau mode de paiement valide.",
                    variant: "error"
                });
                setShowModalMessage(true);
            } else if (paymentError) {
                // Fallback to generic payment error if not strictly expired locally but API says error
                setSuccessMessage({
                    title: "Problème de paiement",
                    description: paymentError,
                    variant: "error"
                });
                setShowModalMessage(true);
            } else {
                // Clear error messages if resolved?
                // Don't clear success messages!
                // We need to distinguish error modal from success modal?
                // They share `showModalMessage` and `successMessage` state.
                // We should only clear if currently showing an ERROR.
                if (successMessage.variant === 'error') {
                    setShowModalMessage(false);
                }
            }
        }
    }, [paymentMethod, paymentError, paymentErrorCode]);

    const isCurrentPlan =
        (effectiveIsPremium && selectedPlan === "premium") ||
        (!effectiveIsPremium && selectedPlan === "starter");

    const lastActionTime = useRef<number>(0);

    const processUpdate = async () => {
        setLoading(true);
        lastActionTime.current = Date.now(); // Mark action start time
        // Do NOT clear success message immediately if switching context? 
        // Better to clear it to avoid confusion.
        setShowSuccessMessage(false);
        setSuccessPlan(null);
        try {
            const res = await fetch('/api/user/update-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: selectedPlan })
            });
            const data = await res.json();

            if (res.ok) {
                console.log("Update API Response:", data);
                console.log("Selected Plan:", selectedPlan); // Log selected plan

                // Check for clientSecret -> Immediate Payment Required
                if (data.clientSecret && selectedPlan === 'premium') {
                    console.log("Immediate payment required. Confirming...");
                    const stripe = await stripePromise;
                    if (!stripe) {
                        throw new Error("Stripe not initialized");
                    }

                    const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret);

                    if (error) {
                        console.error("Payment confirmation failed:", error);
                        // Show error message to user?
                        // For now, let's just log and maybe not show success.
                        throw error;
                    }

                    if (paymentIntent && paymentIntent.status === 'succeeded') {
                        console.log("Payment confirmed successfully!");
                        // Proceed to success handling
                    } else {
                        console.error("Payment status not succeeded:", paymentIntent?.status);
                        throw new Error("Payment not succeeded");
                    }
                }

                const isPremiumSuccess = selectedPlan === 'premium' && (data.status === 'updated' || data.status === 'created' || data.status === 'already_premium' || data.status === 'reactivated');
                const isStarterSuccess = selectedPlan === 'starter' && (data.status === 'canceled_at_period_end' || data.status === 'already_starter');

                // If we confirmed payment, it is a success even if status in data was initial
                if (isPremiumSuccess || isStarterSuccess || (data.clientSecret && !data.error)) {
                    setSuccessPlan(selectedPlan);
                    if (data.currentPeriodEnd) {
                        setSubscriptionEndDate(data.currentPeriodEnd);
                    }
                    setShowSuccessMessage(true);
                    // Refresh user context to update UI to 'Premium' state without reload
                    await refreshUser();
                }
            } else {
                console.error("Update failed", data.error);
                // Maybe show error toast
            }
        } catch (err) {
            console.error("Update error", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = () => {
        if (isPremiumUser && selectedPlan === 'starter') {
            setShowDowngradeModal(true);
            return;
        }
        processUpdate();
    };

    const confirmDowngrade = () => {
        setShowDowngradeModal(false);
        processUpdate();
    };

    const handleDeletePaymentMethod = () => {
        setShowDeleteModal(true);
    };

    const confirmDeletePaymentMethod = async () => {
        if (!paymentMethod) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/user/payment-methods?id=${paymentMethod.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Determine if we need to show starter success message?
                // Deletion implies downgrade.
                setSuccessPlan('starter');
                // We could fetch subscription details to get the exact end date, 
                // but let's assume end of period or just let the user see the banner.
                // Or better, let's trigger a refresh or check.
                setShowDeleteModal(false);
                setPaymentMethod(null);

                // Fetch updated subscription details to enable success banner with date
                fetch(`/api/user/subscription-details?t=${Date.now()}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.current_period_end) {
                            setSubscriptionEndDate(data.current_period_end);
                        } else if (premiumEndAt) {
                            // Fallback if already set in context, though context might be stale immediately
                            setSubscriptionEndDate(Math.floor(new Date(premiumEndAt).getTime() / 1000));
                        }
                        setShowSuccessMessage(true);
                    });

                await refreshUser();
            } else {
                console.error("Failed to delete payment method");
            }
        } catch (error) {
            console.error("Error deleting payment method", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditPaymentMethod = () => {
        console.log("Edit payment method");
        handleStartSetup();
    };

    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7069FA]" />
            </div>
        );
    }

    return (
        <div className="w-full text-left mt-[14px] mb-8 px-[100px]">
            <ConfirmationModal
                open={showDowngradeModal}
                title="Modification d’abonnement"
                variant="info"
                messageTitle="Etes-vous sûr de vouloir changer d’abonnement ?"
                messageDescription="L’abonnement Starter permet de créer et d’utiliser gratuitement uniquement un seul entraînement composé de 10 exercices maximum."
                onConfirm={confirmDowngrade}
                confirmLabel="Modifier"
                onClose={() => {
                    setShowDowngradeModal(false);
                    setSelectedPlan("premium");
                }}
                onCancel={() => {
                    setShowDowngradeModal(false);
                    setSelectedPlan("premium");
                }}
                cancelLabel="Annuler"
                confirmButtonProps={{ loading }}
                cancelButtonProps={{ disabled: loading }}
            >
                <div className="space-y-4">
                    <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                        En cliquant sur <span className="text-[#3A416F]">« Modifier »</span> vous passerez à l’abonnement Starter dès la fin de votre abonnement Premium. Vous ne serez plus débité de 2,49 € tous les mois. Vous pourrez repasser à un abonnement Premium à tout moment.
                    </p>
                    <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                        En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> aucun changement ne sera appliqué à votre abonnement et vous continuerez de profiter d’un stockage illimité.
                    </p>
                </div>
            </ConfirmationModal>

            <ConfirmationModal
                open={showDeleteModal}
                title="Suppression du moyen de paiement"
                variant="warning"
                messageTitle="Attention"
                messageDescription={
                    <span>
                        En supprimant votre moyen de paiement, vous mettrez fin à votre abonnement Premium et vous serez basculé vers un abonnement Starter.
                    </span>
                }
                onConfirm={confirmDeletePaymentMethod}
                confirmLabel="Supprimer"
                onClose={() => setShowDeleteModal(false)}
                onCancel={() => setShowDeleteModal(false)}
                confirmButtonProps={{ loading: isDeleting }}
                cancelButtonProps={{ disabled: isDeleting }}
            >
                <div className="space-y-4">
                    <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                        En cliquant sur <span className="text-[#3A416F]">« Supprimer »</span> vous passerez à l’abonnement Starter dès la fin de votre abonnement Premium. Vous ne serez plus débité de 2,49 € tous les mois. Vous pourrez repasser à un abonnement Premium à tout moment.
                    </p>
                    <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                        En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> aucun changement ne sera appliqué à votre abonnement et vous continuerez à profiter d’un stockage illimité.
                    </p>
                </div>
            </ConfirmationModal>
            {showSuccessMessage && (
                <div className="mb-6 w-full">
                    <ModalMessage
                        variant="success"
                        title={successPlan === 'starter' ? "Changement d’abonnement pris en compte" : "Félicitations !"}
                        description={successPlan === 'starter'
                            ? `Vous passerez à un abonnement Starter dès la fin de votre période d’abonnement Premium actuelle, soit le ${subscriptionEndDate ? new Date(subscriptionEndDate * 1000).toLocaleDateString('fr-FR') : ''}.`
                            : "Votre abonnement a été modifié avec succès. Vous avez maintenant accès à l’ensemble des fonctionnalités d’un compte Glift Premium."
                        }
                    />
                </div>
            )}
            {showModalMessage && (
                <div className="mb-6 w-full">
                    <ModalMessage
                        variant={successMessage.variant}
                        title={successMessage.title}
                        description={successMessage.description}
                        onClose={successMessage.variant === 'error' ? undefined : () => setShowModalMessage(false)}
                    />
                </div>
            )}
            <div className="space-y-4 mb-0">
                <PlanOption
                    title="Abonnement Starter"
                    subtitle="avec stockage limité"
                    price="0 €"
                    period="/mois"
                    isSelected={selectedPlan === "starter"}
                    onSelect={() => setSelectedPlan("starter")}
                />
                <PlanOption
                    title="Abonnement Premium"
                    subtitle="avec stockage illimité"
                    price="2,49 €"
                    period="/mois"
                    isSelected={selectedPlan === "premium"}
                    onSelect={() => setSelectedPlan("premium")}
                    badge={(!isPremiumUser && trial === false) ? (
                        <span className="text-[10px] font-bold text-[#00D591] bg-[#DCFAF1] px-2 py-[2px] rounded-full h-[20px] flex items-center w-fit uppercase">
                            Bénéficiez de 30 jours pour tester gratuitement
                        </span>
                    ) : null}
                />
            </div>

            {selectedPlan === 'premium' && (
                <div className="mt-[20px] mb-[40px]">
                    {paymentMethod && !isAddingMethod ? (
                        <PaymentMethodCard
                            brand={paymentMethod.brand}
                            last4={paymentMethod.last4}
                            expMonth={paymentMethod.exp_month}
                            expYear={paymentMethod.exp_year}
                            onEdit={handleEditPaymentMethod}
                            onDelete={handleDeletePaymentMethod}
                            error={paymentError}
                        />
                    ) : (
                        <div className="w-full rounded-[8px] border-[2px] border-dashed border-[#A1A5FD] hover:border-[#7069FA] transition-colors overflow-hidden">
                            {!isAddingMethod ? (
                                <button
                                    onClick={handleStartSetup}
                                    type="button"
                                    className="w-full h-[60px] text-[#A1A5FD] hover:text-[#7069FA] transition-colors text-[16px] font-semibold flex items-center justify-center cursor-pointer bg-transparent"
                                >
                                    + Ajouter un mode de paiement
                                </button>
                            ) : (
                                <div className="px-6 pb-6 pt-10 bg-white relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddingMethod(false);
                                            setSetupData(null);
                                        }}
                                        onMouseEnter={() => setCloseHovered(true)}
                                        onMouseLeave={() => setCloseHovered(false)}
                                        className="absolute right-4 top-4 h-6 w-6 transition-opacity z-10"
                                        aria-label="Fermer"
                                    >
                                        <img
                                            src={closeHovered ? "/icons/close_hover.svg" : "/icons/close.svg"}
                                            alt="Fermer"
                                            className="w-full h-full"
                                        />
                                    </button>
                                    {setupData ? (
                                        <Elements stripe={stripePromise} options={{
                                            clientSecret: setupData.clientSecret,
                                            locale: 'fr',
                                            fonts: [
                                                {
                                                    cssSrc: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap',
                                                },
                                            ],
                                            appearance: {
                                                theme: 'flat',
                                                variables: {
                                                    colorPrimary: '#7069FA',
                                                    colorBackground: '#ffffff',
                                                    colorText: '#5D6494',
                                                    colorDanger: '#df1b41',
                                                    fontFamily: 'Quicksand, system-ui, sans-serif',
                                                    spacingUnit: '4px',
                                                    borderRadius: '5px',
                                                    fontSizeBase: '16px',
                                                    colorTextSecondary: '#D7D4DC',
                                                    colorTextPlaceholder: '#D7D4DC',
                                                },
                                                rules: {
                                                    '.Input': {
                                                        border: '1px solid #D7D4DC',
                                                        padding: '10px 15px',
                                                    },
                                                    '.Input:focus': {
                                                        borderColor: 'transparent',
                                                        boxShadow: '0 0 0 2px #A1A5FD',
                                                    },
                                                }
                                            }
                                        }}>
                                            <CheckoutForm
                                                priceLabel="2,49 €/mois"
                                                clientSecret={setupData.clientSecret}
                                                plan={setupData.plan}
                                                customerId={setupData.customerId}
                                                subscriptionId={setupData.subscriptionId}
                                                submitButtonText={paymentMethod ? "Enregistrer" : "Démarrer mon abonnement"}
                                                mode={setupData.mode}
                                                onSuccess={async (newPaymentMethodId?: string) => {
                                                    // Prevent race condition with useEffect fetching stale data
                                                    lastActionTime.current = Date.now();

                                                    // Always set as default to ensure subscription is updated/reactivated
                                                    if (newPaymentMethodId) {
                                                        try {
                                                            await fetch('/api/user/payment-methods', {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ paymentMethodId: newPaymentMethodId }),
                                                            });
                                                        } catch (err) {
                                                            console.error("Failed to set default payment method", err);
                                                        }
                                                    }

                                                    await fetchPaymentMethod();
                                                    // Trigger update to sync subscription status immediately
                                                    await refreshUser();

                                                    if (paymentMethod) {
                                                        // Updated existing
                                                        setSuccessMessage({
                                                            title: "Mode de paiement modifié avec succès",
                                                            description: "Votre changement de mode de paiement a bien été pris en compte. Ce nouveau moyen de paiement sera utilisé pour le prochain prélèvement.",
                                                            variant: "success"
                                                        });
                                                        setShowModalMessage(true);
                                                    } else {
                                                        // New subscription
                                                        setSelectedPlan('premium');
                                                        setSuccessPlan('premium');
                                                        setShowSuccessMessage(true);
                                                    }

                                                    setIsAddingMethod(false);
                                                }}

                                            />
                                        </Elements>
                                    ) : (
                                        <div className="flex justify-center items-center py-10">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7069FA]"></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className={`flex justify-center ${selectedPlan === "starter" ? "mt-[32px]" : ""}`}>
                <CTAButton
                    onClick={handleUpdate}
                    disabled={isCurrentPlan || (selectedPlan === 'premium' && !paymentMethod)}
                    loading={loading}
                    className="px-[30px] font-semibold bg-[#F4F5FE] text-[#7069FA] hover:bg-[#EBEDFE]"
                >
                    Mettre à jour
                </CTAButton>
            </div>
        </div>
    );
}
