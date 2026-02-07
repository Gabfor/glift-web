import { useUser } from "@/context/UserContext";
import CTAButton from "@/components/CTAButton";
import Tooltip from "@/components/Tooltip";
import { useEffect, useState } from "react";

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
}: {
    title: string;
    subtitle: string;
    price: string;
    period: string;
    isSelected: boolean;
    onSelect: () => void;
}) => {
    return (
        <div
            onClick={onSelect}
            className="flex items-center justify-between py-2 cursor-pointer group"
        >
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
    );
};

const PaymentMethodCard = ({
    brand,
    last4,
    expMonth,
    expYear,
    onEdit,
    onDelete
}: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    // Basic mapping for brand icons
    const getBrandIcon = (brandName: string) => {
        const name = brandName.toLowerCase();
        if (name === 'visa') return '/icons/visa.svg';
        if (name === 'mastercard') return '/icons/mastercard.svg';
        if (name === 'amex') return '/icons/amex.svg';
        if (name === 'cb') return '/icons/cb.svg';
        return null; // or generic default
    };

    const brandIcon = getBrandIcon(brand);

    return (
        <div className="w-full h-[80px] rounded-[8px] bg-[#FAFAFF] border border-[#E6E6FF] flex items-center justify-between px-[20px]">
            <div className="flex items-center gap-4">
                <div className="w-[50px] h-[34px] flex items-center justify-center overflow-hidden">
                    {brandIcon ? (
                        <img src={brandIcon} alt={brand} className={`${brand.toLowerCase() === 'visa' ? 'h-[25px]' : 'h-full'} w-auto object-contain`} />
                    ) : (
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{brand}</span>
                    )}
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[14px] font-semibold text-[#2E3271]">
                        {brand.charAt(0).toUpperCase() + brand.slice(1)} qui se termine par {last4}
                    </span>
                    <span className="text-[12px] font-semibold text-[#5D6494]">
                        Expire le : {expMonth.toString().padStart(2, '0')}/{expYear}
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

import ModalMessage from "@/components/ui/ModalMessage";
import { PaymentMethod } from "@/lib/services/paymentService";

interface SubscriptionManagerProps {
    initialPaymentMethods?: PaymentMethod[];
    initialIsPremium?: boolean; // Optional because it might not be provided in all usages
}

export default function SubscriptionManager({ initialPaymentMethods, initialIsPremium = false }: SubscriptionManagerProps) {
    const { isPremiumUser, isLoading, refreshUser } = useUser();

    // Initialize with server-side value if available, or default to starter
    const [selectedPlan, setSelectedPlan] = useState<"starter" | "premium">(() => {
        return initialIsPremium ? "premium" : "starter";
    });

    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(initialPaymentMethods?.[0] || null);

    // New state for inline form
    const [isAddingMethod, setIsAddingMethod] = useState(false);
    const [closeHovered, setCloseHovered] = useState(false);
    const [setupData, setSetupData] = useState<{ clientSecret: string; customerId: string; subscriptionId: string; plan: string } | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const [successPlan, setSuccessPlan] = useState<'premium' | 'starter' | null>(null);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState<number | null>(null);

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

    const [hasSyncedWithServer, setHasSyncedWithServer] = useState(false);

    // Sync sync-state: if context matches initial, we are synced
    useEffect(() => {
        if (!isLoading && isPremiumUser === initialIsPremium) {
            setHasSyncedWithServer(true);
        }
    }, [isPremiumUser, isLoading, initialIsPremium]);

    // Sync state with user profile when loaded client-side (reconciliation)
    useEffect(() => {
        if (!isLoading && hasSyncedWithServer) {
            setSelectedPlan(isPremiumUser ? "premium" : "starter");
        }
    }, [isPremiumUser, isLoading, hasSyncedWithServer]);

    useEffect(() => {
        if (isPremiumUser) {
            fetchPaymentMethod();
            // Fetch subscription details to check for pending cancellation
            fetch('/api/user/subscription-details')
                .then(res => res.json())
                .then(data => {
                    if (data && data.cancel_at_period_end) {
                        setSuccessPlan('starter');
                        if (data.current_period_end) {
                            setSubscriptionEndDate(data.current_period_end);
                        }
                        setShowSuccessMessage(true);
                    }
                })
                .catch(err => console.error("Failed to fetch sub details", err));
        }
    }, [isPremiumUser]);


    // Determine effective premium status: use server prop if not yet synced
    const effectiveIsPremium = hasSyncedWithServer ? isPremiumUser : initialIsPremium;

    const isCurrentPlan =
        (effectiveIsPremium && selectedPlan === "premium") ||
        (!effectiveIsPremium && selectedPlan === "starter");

    const handleUpdate = async () => {
        setLoading(true);
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
                const isPremiumSuccess = selectedPlan === 'premium' && (data.status === 'updated' || data.status === 'created' || data.status === 'already_premium');
                const isStarterSuccess = selectedPlan === 'starter' && (data.status === 'canceled_at_period_end' || data.status === 'already_starter');

                if (isPremiumSuccess || isStarterSuccess) {
                    setSuccessPlan(selectedPlan);
                    if (data.currentPeriodEnd) {
                        setSubscriptionEndDate(data.currentPeriodEnd);
                    }
                    setShowSuccessMessage(true);
                    // Refresh user context to update UI to 'Premium' state without reload
                    await refreshUser();
                    setHasSyncedWithServer(true); // Force sync on successful update
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

    const handleDeletePaymentMethod = () => {
        console.log("Delete payment method");
        // Implement deletion logic
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
            {showSuccessMessage && (
                <div className="mb-6 w-full">
                    <ModalMessage
                        variant="success"
                        title={successPlan === 'starter' ? "Changement d’abonnement pris en compte" : "Félicitations !"}
                        description={successPlan === 'starter'
                            ? `Vous passerez à un abonnement Starter dès la fin de votre période d’abonnement Premium, soit le ${subscriptionEndDate ? new Date(subscriptionEndDate * 1000).toLocaleDateString('fr-FR') : ''}.`
                            : "Votre abonnement a été modifié avec succès. Vous avez maintenant accès à l’ensemble des fonctionnalités d’un compte Glift Premium."
                        }
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
                        />
                    ) : (
                        <div className="w-full rounded-[8px] border-[2px] border-dashed border-[#A1A5FD] overflow-hidden">
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
                                                onSuccess={() => {
                                                    fetchPaymentMethod();
                                                    // Trigger update to sync subscription status immediately
                                                    handleUpdate();
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
