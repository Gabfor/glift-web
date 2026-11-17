import { useUser } from "@/context/UserContext";
import CTAButton from "@/components/CTAButton";
import Tooltip from "@/components/Tooltip";
import { useEffect, useState, useRef, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import ModalMessage from "@/components/ui/ModalMessage";
import { PaymentMethod } from "@/lib/services/paymentService";
import GliftSpinner from "@/components/ui/GliftSpinner";


import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "@/components/stripe/CheckoutForm";
import PaymentFormSkeleton from "@/components/stripe/PaymentFormSkeleton";
import { useGlobalLoader } from "@/context/GlobalLoaderContext";
import { useSiteSettings, SiteSettings } from "@/hooks/useSiteSettings";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

// Initialize Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PlanOption = ({
    title,
    icon,
    price,
    period,
    isSelected,
    onSelect,
}: {
    title: string;
    icon?: string;
    price: string;
    period: string;
    isSelected: boolean;
    onSelect: () => void;
}) => {
    return (
        <div
            onClick={onSelect}
            className="flex flex-col cursor-pointer group py-2"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-[10px] min-w-0">
                    <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                        <img
                            src={isSelected ? "/icons/radio_ON.svg" : "/icons/radio_OFF.svg"}
                            alt={isSelected ? "Selected" : "Not selected"}
                            className="w-full h-full"
                        />
                    </div>
                    <div className="flex items-center gap-[5px] min-w-0">
                        {icon && (
                            <div className="relative h-[20px] flex items-center justify-center shrink-0">
                                <img
                                    src={icon}
                                    alt=""
                                    className="h-[20px] w-auto object-contain"
                                />
                            </div>
                        )}
                        <span className={`text-[15px] sm:text-[16px] font-semibold leading-none ${isSelected ? "text-[#3A416F]" : "text-[#D7D4DC]"}`}>
                            {title}
                        </span>
                    </div>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                    <span
                        className={`text-[18px] sm:text-[20px] font-bold ${isSelected ? "text-[#3A416F]" : "text-[#D7D4DC]"
                            }`}
                    >
                        {price}
                    </span>
                    {period && (
                        <span
                            className={`text-[14px] sm:text-[16px] font-medium ${isSelected ? "text-[#5D6494]" : "text-[#D7D4DC]"
                                }`}
                        >
                            {period}
                        </span>
                    )}
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
    walletType,
    onEdit,
    onDelete,
    error // New prop for external errors
}: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    walletType?: string | null;
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
        <div className="w-full min-h-[80px] h-auto py-3 sm:py-0 rounded-[8px] bg-[#FAFAFF] border border-[#E6E6FF] flex items-center justify-between px-3 sm:px-[20px] gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                {walletType === 'apple_pay' ? (
                    <div className="w-[46px] sm:w-[50px] h-[30px] sm:h-[32px] rounded-[6px] bg-black flex items-center justify-center gap-1 shrink-0 shadow-glift">
                        <svg viewBox="0 0 384 512" fill="currentColor" className="w-[10px] h-[13px] text-white -mt-[2px]">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                        </svg>
                        <span className="font-bold text-[13px] text-white tracking-tight -mt-[1px]">Pay</span>
                    </div>
                ) : walletType === 'google_pay' ? (
                    <div className="w-[46px] sm:w-[50px] h-[30px] sm:h-[32px] rounded-[6px] bg-white border border-[#D7D4DC] flex items-center justify-center gap-1 shrink-0 shadow-glift">
                        <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span className="font-bold text-[13px] text-[#3c4043] tracking-tight -mt-[1px]">Pay</span>
                    </div>
                ) : (
                    <div className="w-[40px] sm:w-[50px] h-[34px] flex items-center justify-center overflow-hidden shrink-0">
                        {brandIcon ? (
                            <img src={brandIcon} alt={brand} className="h-[22px] sm:h-[25px] w-auto object-contain" />
                        ) : (
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{brand}</span>
                        )}
                    </div>
                )}
                <div className="flex flex-col text-left min-w-0">
                    <span className="text-[12px] sm:text-[14px] font-semibold text-[#3A416F] truncate">
                        <span className="hidden sm:inline">
                            {brand.charAt(0).toUpperCase() + brand.slice(1)} qui se termine par {last4}
                        </span>
                        <span className="inline sm:hidden">
                            {brand.charAt(0).toUpperCase() + brand.slice(1)} (•••• {last4})
                        </span>
                    </span>
                    <span className={`text-[10px] sm:text-[12px] font-semibold ${isExpired ? 'text-[#EF4F4E]' : 'text-[#5D6494]'}`}>
                        {isExpired ? "Expirée depuis" : "Expire en"} : {expMonth.toString().padStart(2, '0')}/{expYear}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onEdit}
                    type="button"
                    className="text-[12px] sm:text-[14px] font-semibold text-[#7069FA] hover:text-[#5a52cc] transition-colors"
                >
                    Modifier
                </button>
                <Tooltip content="Supprimer" asChild>
                    <button
                        onClick={onDelete}
                        type="button"
                        className="group w-[20px] h-[20px] relative flex items-center justify-center cursor-pointer select-none"
                    >
                        <img
                            src="/icons/delete_grey.svg"
                            alt="Supprimer"
                            className="pointer-events-none absolute inset-0 w-full h-full object-contain [@media(hover:hover)]:group-hover:opacity-0 transition-opacity duration-200"
                        />
                        <img
                            src="/icons/delete_grey_hover.svg"
                            alt=""
                            className="pointer-events-none absolute inset-0 w-full h-full object-contain opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-200"
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
            return "Le paiement a été refusé par ta banque (fonds insuffisants).";
        case 'lost_card':
        case 'stolen_card':
            return "Cette carte a été déclarée perdue ou volée. Merci d'utiliser un autre moyen de paiement.";
        case 'expired_card':
            return "Ta carte a expiré. Merci de mettre à jour ton moyen de paiement.";
        case 'incorrect_cvc':
            return "Le code de sécurité (CVC) est incorrect.";
        case 'processing_error':
            return "Une erreur est survenue lors du traitement du paiement. Merci de réessayer.";
        case 'card_declined':
            return "Ta carte a été refusée. Merci de contacter ta banque ou d'essayer une autre carte.";
        case 'authentication_required':
            return "L'authentification de ta banque a échoué. Merci de réessayer.";
        default:
            return "Le dernier paiement a échoué. Merci de vérifier ton moyen de paiement.";
    }
};

interface SubscriptionManagerProps {
    initialPaymentMethods?: PaymentMethod[];
    initialIsPremium?: boolean; // Optional because it might not be provided in all usages
    initialSettings?: Partial<SiteSettings>;
    initialSubscriptionDetails?: any;
}

export default function SubscriptionManager({ initialPaymentMethods, initialIsPremium = false, initialSettings, initialSubscriptionDetails }: SubscriptionManagerProps) {
    const { isPremiumUser, isLoading, refreshUser, premiumTrialEndAt, premiumEndAt, trial, profile } = useUser();
    const {
        trialDays,
        starterMaxTrainings,
        starterMaxExercises,
        premiumMonthlyEnabled,
        premiumYearlyEnabled,
        premiumMonthlyPrice,
        premiumYearlyPrice,
    } = useSiteSettings(initialSettings);
    const formattedMonthlyPrice = premiumMonthlyPrice || "3,99";
    const formattedYearlyPrice = premiumYearlyPrice || "39,99";
    const starterTrainingCountText = starterMaxTrainings === 1 ? "1 seul entraînement" : `${starterMaxTrainings} entraînements`;
    const { triggerLoader, stopLoader } = useGlobalLoader();

    const showToggle = premiumMonthlyEnabled && premiumYearlyEnabled;
    const initialInterval: "monthly" | "yearly" = (() => {
        if (initialSubscriptionDetails?.interval === "yearly" || initialSubscriptionDetails?.interval === "monthly") {
            return initialSubscriptionDetails.interval;
        }
        if (profile?.subscription_interval === "yearly" || profile?.subscription_interval === "monthly") {
            return profile.subscription_interval;
        }
        if (!premiumMonthlyEnabled && premiumYearlyEnabled) return "yearly";
        return "monthly";
    })();

    const [interval, setInterval] = useState<"monthly" | "yearly">(initialInterval);

    useEffect(() => {
        if (profile?.subscription_interval === 'yearly' || profile?.subscription_interval === 'monthly') {
            setCurrentSubInterval(profile.subscription_interval);
            setInterval(profile.subscription_interval);
        }
    }, [profile?.subscription_interval]);

    useEffect(() => {
        if (!premiumMonthlyEnabled && premiumYearlyEnabled) {
            setInterval("yearly");
        } else if (premiumMonthlyEnabled && !premiumYearlyEnabled) {
            setInterval("monthly");
        }
    }, [premiumMonthlyEnabled, premiumYearlyEnabled]);

    const parsePrice = (priceStr?: string) => {
        if (!priceStr) return 0;
        return parseFloat(priceStr.replace(",", "."));
    };

    const monthlyVal = parsePrice(premiumMonthlyPrice);
    const yearlyVal = parsePrice(premiumYearlyPrice);
    const discountPercent =
        monthlyVal > 0 && yearlyVal > 0 && 12 * monthlyVal > yearlyVal
            ? Math.round(((12 * monthlyVal - yearlyVal) / (12 * monthlyVal)) * 100)
            : 0;

    const isYearly = interval === "yearly";
    const currentPrice = isYearly ? formattedYearlyPrice : formattedMonthlyPrice;
    const currentPeriod = isYearly ? "/an" : "/mois";

    // Initialize with server-side value if available, or default to starter
    const [selectedPlan, setSelectedPlan] = useState<"starter" | "premium">(() => {
        return initialIsPremium ? "premium" : "starter";
    });

    const [loading, setLoading] = useState(false);
    const [currentSubInterval, setCurrentSubInterval] = useState<"monthly" | "yearly">(initialInterval);
    const [showIntervalModal, setShowIntervalModal] = useState(false);
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
    const [successMessage, setSuccessMessage] = useState<{ title: React.ReactNode; description: React.ReactNode; variant: 'success' | 'error' | 'info' | 'warning' }>({
        title: "",
        description: "",
        variant: "success"
    });

    const [successPlan, setSuccessPlan] = useState<'premium' | 'starter' | null>(null);
    const successPlanRef = useRef<'premium' | 'starter' | null>(null);
    useEffect(() => {
        successPlanRef.current = successPlan;
    }, [successPlan]);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState<number | null>(() => {
        return initialSubscriptionDetails?.current_period_end || null;
    });
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentErrorCode, setPaymentErrorCode] = useState<string | null>(null);
    const [isUndoingDowngrade, setIsUndoingDowngrade] = useState(false);
    const [isCardReadded, setIsCardReadded] = useState(false);
    const paymentFormRef = useRef<HTMLDivElement>(null);

    const scrollToPaymentForm = useCallback(() => {
        if (!paymentFormRef.current) return;
        paymentFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    useEffect(() => {
        if (isAddingMethod) {
            const timer = setTimeout(() => {
                scrollToPaymentForm();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isAddingMethod, scrollToPaymentForm]);

    useEffect(() => {
        if (isAddingMethod && setupData) {
            const timer = setTimeout(() => {
                scrollToPaymentForm();
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [isAddingMethod, setupData, scrollToPaymentForm]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const isCardExpired = paymentMethod
        ? paymentMethod.exp_year < currentYear ||
          (paymentMethod.exp_year === currentYear && paymentMethod.exp_month < currentMonth)
        : false;

    const rawTrialEnd = profile?.premium_trial_end_at || premiumTrialEndAt || (profile?.premium_trial_started_at ? (() => {
        const d = new Date(new Date(profile.premium_trial_started_at).getTime() + 30 * 24 * 60 * 60 * 1000);
        d.setHours(23, 59, 59, 999);
        return d.toISOString();
    })() : null);
    const isTrialActive = isPremiumUser && Boolean(
        rawTrialEnd && new Date(rawTrialEnd) > now
    );
    const isTrialCancelled = isTrialActive && (
        profile?.cancellation === true ||
        successPlan === 'starter'
    );
    const trialEndFormatted = rawTrialEnd
        ? new Date(rawTrialEnd).toLocaleDateString('fr-FR')
        : '';

    const formattedEndDate = subscriptionEndDate
        ? new Date(subscriptionEndDate * 1000).toLocaleDateString('fr-FR')
        : premiumEndAt
        ? new Date(premiumEndAt).toLocaleDateString('fr-FR')
        : '';

    const hasTrialHistory = Boolean(
        trial === true ||
        profile?.trial === true ||
        profile?.premium_trial_started_at ||
        profile?.premium_trial_end_at ||
        premiumTrialEndAt ||
        profile?.premium_end_at ||
        premiumEndAt
    );

    const hasPaidHistory = Boolean(profile?.premium_end_at || premiumEndAt);

    const trialEndTimestamp = rawTrialEnd ? new Date(rawTrialEnd).getTime() : null;
    const isWithin7DaysAfterTrial = trialEndTimestamp
        ? (now.getTime() - trialEndTimestamp) <= 7 * 24 * 60 * 60 * 1000
        : true;

    const isTrialEndedWithoutCard = !isPremiumUser && !isTrialActive && Boolean(profile?.premium_trial_started_at || profile?.premium_trial_end_at || trial === true) && !hasPaidHistory && !paymentMethod;

    const fetchPaymentMethod = async () => {
        try {
            console.log("Fetching payment methods...");
            const res = await fetch('/api/user/payment-methods', { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                if (json.data && json.data.length > 0) {
                    const pm = json.data[0];
                    const storedWallet = typeof window !== 'undefined' ? sessionStorage.getItem('last_simulated_wallet') : null;
                    setPaymentMethod({
                        ...pm,
                        wallet_type: pm.wallet_type || storedWallet || null,
                    });
                    setIsAddingMethod(false); // Close form on success
                } else {
                    setPaymentMethod(null);
                }
            }
        } catch (err) {
            console.error("Failed to fetch payment methods", err);
        }
    };

    const handleStartSetup = async (customInterval?: "monthly" | "yearly") => {
        setIsAddingMethod(true);
        try {
            const intToUse = (typeof customInterval === 'string' ? customInterval : null) || interval;
            const res = await fetch('/api/user/setup-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interval: intToUse })
            });
            if (res.ok) {
                const data = await res.json();
                setSetupData(data);
            }
        } catch (e) {
            console.error("Setup error", e);
            setIsAddingMethod(false);
        }
    };

    useEffect(() => {
        if (isAddingMethod) {
            handleStartSetup();
        }
    }, [interval]);

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
            if (premiumEndAt && new Date(premiumEndAt) > now && !isTrialActive) {
                setSuccessPlan('starter');
                setSubscriptionEndDate(Math.floor(new Date(premiumEndAt).getTime() / 1000));
                setShowSuccessMessage(true);
            }

            // Fetch subscription details to check for pending cancellation
            fetch(`/api/user/subscription-details?t=${Date.now()}`)
                .then(res => res.json())
                .then(data => {
                    if (Date.now() - lastActionTime.current < 10000) return;

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
                        if (data.current_period_end) {
                            setSubscriptionEndDate(data.current_period_end);
                        }
                        if (data.interval === 'yearly' || data.interval === 'monthly') {
                            setInterval(data.interval);
                            setCurrentSubInterval(data.interval);
                        }
                        const hasPaymentError = Boolean(data.lastInvoiceErrorCode || data.lastInvoiceError);
                        // User has a Stripe subscription
                        if (!hasPaymentError && (data.cancel_at_period_end || hasFuturePremiumEnd) && !isTrialActive) {
                            // Cancellation pending (Stripe or DB)
                            setSuccessPlan('starter');
                            // Show end of current period
                            if (data.current_period_end) {
                                setSubscriptionEndDate(data.current_period_end);
                            } else if (hasFuturePremiumEnd) {
                                setSubscriptionEndDate(Math.floor(new Date(premiumEndAt!).getTime() / 1000));
                            } else {
                                setSubscriptionEndDate(Math.floor(Date.now() / 1000));
                            }
                            setShowSuccessMessage(true);
                        } else if (hasPaymentError) {
                            setShowSuccessMessage(false);
                            setSuccessPlan(null);
                        } else {
                            // Active Stripe subscription (auto-renews) AND NO local cancellation date
                            if (successPlanRef.current !== 'premium' && !isCardReadded && !isUndoingDowngrade) {
                                setShowSuccessMessage(false);
                                setSuccessPlan(null);
                            }
                        }
                    } else {
                        // NO Stripe subscription (or error)
                        // Fallback to manual/local checks
                        if (hasFuturePremiumEnd) {
                            // User cancelled manually (e.g. removed payment method or admin action)
                            setSuccessPlan('starter');
                            setSubscriptionEndDate(Math.floor(new Date(premiumEndAt!).getTime() / 1000));
                            setShowSuccessMessage(true);
                        } else if (profile?.cancellation === true && hasFutureTrialEnd) {
                            // User cancelled trial manually
                            setSuccessPlan('starter');
                            setSubscriptionEndDate(Math.floor(new Date(premiumTrialEndAt!).getTime() / 1000));
                            setShowSuccessMessage(true);
                        } else {
                            if (successPlanRef.current !== 'premium' && !isCardReadded && !isUndoingDowngrade) {
                                setShowSuccessMessage(false);
                                setSuccessPlan(null);
                            }
                        }
                    }
                })
                .catch(err => console.error("Failed to fetch sub details", err));
        }
    }, [isPremiumUser, premiumTrialEndAt, premiumEndAt, profile?.cancellation]);


    // Determine effective premium status: use server prop if not yet synced
    // SIMPLIFICATION: We trust context after mount.
    const effectiveIsPremium = isPremiumUser;
    // const effectiveIsPremium = true; // SIMULATION: FORCE VALID PREMIUM

    // Check for expiry locally
    useEffect(() => {
        if (paymentMethod && effectiveIsPremium) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const isLocalExpired = paymentMethod.exp_year < currentYear || (paymentMethod.exp_year === currentYear && paymentMethod.exp_month < currentMonth);
            const isExpired = isLocalExpired || paymentErrorCode === 'expired_card';

            if (isExpired) {
                setSuccessMessage({
                    title: "Ton moyen de paiement a expiré",
                    description: (
                        <span>
                            Pour continuer à bénéficier d’un abonnement Premium une fois la période de facturation actuelle terminée, renseigne un nouveau moyen de paiement avant{" "}
                            {formattedEndDate ? (
                                <>
                                    le <span className="font-bold text-[#BA2524]">{formattedEndDate}</span>
                                </>
                            ) : (
                                <span className="font-bold text-[#BA2524]">la fin de la période</span>
                            )}
                            .
                        </span>
                    ),
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
                if (successMessage.variant === 'error') {
                    setShowModalMessage(false);
                }
            }
        } else {
            if (successMessage.variant === 'error') {
                setShowModalMessage(false);
            }
        }
    }, [paymentMethod, paymentError, paymentErrorCode, formattedEndDate, effectiveIsPremium]);

    const isIntervalChanged = effectiveIsPremium && selectedPlan === "premium" && interval !== currentSubInterval;
    const isCurrentPlan =
        (effectiveIsPremium && selectedPlan === "premium" && !isIntervalChanged) ||
        (!effectiveIsPremium && selectedPlan === "starter");

    const lastActionTime = useRef<number>(0);

    const processUpdate = async (options?: { isUndo?: boolean }) => {
        setLoading(true);
        triggerLoader(0); // Trigger global loader indefinitely until we finish
        lastActionTime.current = Date.now(); // Mark action start time
        setShowModalMessage(false);
        const changingInterval = !options?.isUndo && isIntervalChanged;
        // Do NOT clear success message immediately if switching context? 
        // Better to clear it to avoid confusion.
        if (!options?.isUndo) {
            setShowSuccessMessage(false);
            setSuccessPlan(null);
            successPlanRef.current = null;
            setIsCardReadded(false);
        }
        try {
            const planToUpdate = options?.isUndo ? 'premium' : selectedPlan;
            const res = await fetch('/api/user/update-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planToUpdate, interval })
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

                const isPremiumSuccess = selectedPlan === 'premium' && (data.status === 'updated' || data.status === 'created' || data.status === 'already_premium' || data.status === 'reactivated' || data.status === 'scheduled_at_period_end');
                const isStarterSuccess = selectedPlan === 'starter' && (data.status === 'canceled_at_period_end' || data.status === 'already_starter');

                // If we confirmed payment, it is a success even if status in data was initial
                if (isPremiumSuccess || isStarterSuccess || (data.clientSecret && !data.error)) {
                    if (changingInterval) {
                        const isDowngradeToMonthly = !isTrialActive && currentSubInterval === "yearly" && interval === "monthly";
                        setCurrentSubInterval(interval);
                        setSuccessPlan('premium');
                        successPlanRef.current = 'premium';
                        if (data.currentPeriodEnd) {
                            setSubscriptionEndDate(data.currentPeriodEnd);
                        }
                        const finalDateStr = data.currentPeriodEnd
                            ? new Date(data.currentPeriodEnd * 1000).toLocaleDateString('fr-FR')
                            : formattedEndDate;

                        setShowSuccessMessage(false);
                        setSuccessMessage({
                            title: isDowngradeToMonthly ? "Changement de formule programmé" : "Formule modifiée avec succès",
                            description: isTrialActive
                                ? `Ton abonnement passera sur la formule ${interval === 'yearly' ? 'annuelle' : 'mensuelle'} à la fin de ton essai gratuit.`
                                : isDowngradeToMonthly
                                ? (
                                    <span>
                                        Ton abonnement annuel reste actif jusqu’au <span className="font-bold text-[#006646]">{finalDateStr}</span>. À cette date, ton abonnement basculera automatiquement sur la formule mensuelle ({formattedMonthlyPrice} €/mois).
                                    </span>
                                )
                                : interval === 'yearly'
                                ? "Félicitations ! Ton abonnement a bien été basculé sur la formule annuelle. Le montant au prorata a été pris en compte."
                                : "Ton abonnement a bien été basculé sur la formule mensuelle. Le montant au prorata a été pris en compte.",
                            variant: "success"
                        });
                        setShowModalMessage(true);
                    } else {
                        setSuccessPlan(selectedPlan);
                        successPlanRef.current = selectedPlan;
                        if (data.currentPeriodEnd) {
                            setSubscriptionEndDate(data.currentPeriodEnd);
                        }
                        setShowModalMessage(false);
                        setShowSuccessMessage(true);
                        if (isStarterSuccess && (isPremiumUser || isTrialActive)) {
                            setSelectedPlan("premium");
                        }
                    }
                    lastActionTime.current = Date.now();
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
            stopLoader();
        }
    };

    const handleUpdate = () => {
        if (isPremiumUser && selectedPlan === 'starter') {
            setShowDowngradeModal(true);
            return;
        }
        if (isIntervalChanged) {
            setShowIntervalModal(true);
            return;
        }
        processUpdate();
    };

    const confirmDowngrade = () => {
        setShowDowngradeModal(false);
        processUpdate();
    };

    const handleDeletePaymentMethod = () => {
        if (isPremiumUser) {
            setShowDeleteModal(true);
        } else {
            confirmDeletePaymentMethod();
        }
    };

    const confirmDeletePaymentMethod = async () => {
        if (!paymentMethod) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/user/payment-methods?id=${paymentMethod.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('last_simulated_wallet');
                }
                setShowDeleteModal(false);
                setPaymentMethod(null);
                window.dispatchEvent(new Event('paymentMethodUpdated'));

                if (isPremiumUser && !isTrialActive) {
                    setSuccessPlan('starter');
                    // Fetch updated subscription details to enable success banner with date
                    fetch(`/api/user/subscription-details?t=${Date.now()}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data && data.current_period_end) {
                                setSubscriptionEndDate(data.current_period_end);
                            } else if (premiumEndAt) {
                                setSubscriptionEndDate(Math.floor(new Date(premiumEndAt).getTime() / 1000));
                            }
                            setShowSuccessMessage(true);
                        });
                } else if (!isPremiumUser) {
                    setShowSuccessMessage(false);
                    setSuccessMessage({
                        title: "Moyen de paiement supprimé",
                        description: "Ton moyen de paiement a été supprimé avec succès. Aucune coordonnée bancaire n'est désormais enregistrée sur ton compte.",
                        variant: "success"
                    });
                    setShowModalMessage(true);
                } else {
                    setShowSuccessMessage(false);
                }

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
                <GliftSpinner size={32} />
            </div>
        );
    }

    return (
        <div className="w-full text-left mt-[14px] mb-8 flex flex-col items-center">
            <ConfirmationModal
                open={showIntervalModal}
                title="Modification de l’abonnement"
                variant="info"
                messageTitle={interval === "yearly" ? "Passer à l’abonnement annuel ?" : "Passer à l’abonnement mensuel ?"}
                messageDescription={
                    isTrialActive ? (
                        <span>
                            Tu profites actuellement de ton essai gratuit. Ta formule passera à l’abonnement {interval === "yearly" ? "annuel" : "mensuel"} dès la fin de ton essai le <span className="font-bold text-[#6660E4]">{trialEndFormatted || formattedEndDate}</span>. Aucun débit n’aura lieu aujourd’hui.
                        </span>
                    ) : (!isTrialActive && currentSubInterval === "yearly" && interval === "monthly") ? (
                        <span>
                            Ton abonnement annuel restera actif jusqu’au <span className="font-bold text-[#6660E4]">{formattedEndDate}</span> puis basculera automatiquement sur la formule mensuelle à <span className="font-bold text-[#6660E4]">{formattedMonthlyPrice} €/mois</span>.
                        </span>
                    ) : (
                        <span>
                            Tu es sur le point de passer à la formule annuelle à <span className="font-bold text-[#6660E4]">{formattedYearlyPrice} €/an</span>. Les jours non utilisés de ton mois en cours seront immédiatement déduits de ta facture et ton année d’abonnement commencera aujourd’hui.
                        </span>
                    )
                }
                onConfirm={() => {
                    setShowIntervalModal(false);
                    processUpdate();
                }}
                confirmLabel="Modifier"
                onClose={() => setShowIntervalModal(false)}
                onCancel={() => setShowIntervalModal(false)}
                cancelLabel="Annuler"
                confirmButtonProps={{ loading }}
                cancelButtonProps={{ disabled: loading }}
            >
                <div className="space-y-4">
                    <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                        En cliquant sur <span className="text-[#3A416F] font-bold">« Modifier »</span> {
                            isTrialActive ? (
                                <span>
                                    ta formule sera enregistrée en facturation {interval === "yearly" ? "annuelle" : "mensuelle"} et prendra effet à la fin de ton essai sans interrompre tes jours offerts.
                                </span>
                            ) : (!isTrialActive && currentSubInterval === "yearly" && interval === "monthly") ? (
                                <span>
                                    ton passage au paiement mensuel au lieu d’un renouvellement annuel sera programmé pour le <span className="text-[#3A416F] font-bold">{formattedEndDate}</span>. Aucun débit n’aura lieu aujourd’hui.
                                </span>
                            ) : (
                                <span>
                                    ta formule passera immédiatement en facturation annuelle avec ajustement au prorata sur ton moyen de paiement.
                                </span>
                            )
                        }
                    </p>
                    <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                        En cliquant sur <span className="text-[#3A416F] font-bold">« Annuler »</span>, aucun changement ne sera appliqué et tu conserveras ta formule {currentSubInterval === "yearly" ? "annuelle" : "mensuelle"}.
                    </p>
                </div>
            </ConfirmationModal>

            <ConfirmationModal
                open={showDowngradeModal}
                title="Modification d’abonnement"
                variant="info"
                messageTitle="Es-tu sûr de vouloir changer d’abonnement ?"
                messageDescription={`L’abonnement Starter permet de conserver ${starterTrainingCountText} de ${starterMaxExercises} exercices. Pour varier tes séances en toute liberté, le Premium reste ton meilleur allié !`}
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
                        En cliquant sur <span className="text-[#3A416F] font-bold">« Modifier »</span> {
                            isTrialActive
                                ? `tu passeras à l’abonnement Starter dès la fin de ton essai de ${trialDays} jours. Tu pourras repasser à un abonnement Premium à tout moment.`
                                : (
                                    <span>
                                        tu passeras à l’abonnement Starter dès la fin de ton abonnement Premium. Tu ne seras plus débité de <span className="text-[#3A416F] font-bold">{currentSubInterval === "yearly" ? formattedYearlyPrice : formattedMonthlyPrice} €</span> tous les {currentSubInterval === "yearly" ? "ans" : "mois"}. Tu pourras repasser à un abonnement Premium à tout moment.
                                    </span>
                                )
                        }
                    </p>
                    <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                        En cliquant sur <span className="text-[#3A416F] font-bold">« Annuler »</span> aucun changement ne sera appliqué à ton abonnement et tu continueras à profiter des avantages Premium.
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
                        En supprimant ton moyen de paiement, tu mettras fin à ton abonnement Premium et tu seras basculé vers un abonnement Starter.
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
                        En cliquant sur <span className="text-[#3A416F] font-bold">« Supprimer »</span> {
                            isTrialActive
                                ? `tu passeras à l’abonnement Starter dès la fin de ton essai de ${trialDays} jours. Tu pourras repasser à un abonnement Premium à tout moment.`
                                : (
                                    <span>
                                        tu passeras à l’abonnement Starter dès la fin de ton abonnement Premium. Tu ne seras plus débité de <span className="text-[#3A416F] font-bold">{currentSubInterval === "yearly" ? formattedYearlyPrice : formattedMonthlyPrice} €</span> tous les {currentSubInterval === "yearly" ? "ans" : "mois"}. Tu pourras repasser à un abonnement Premium à tout moment.
                                    </span>
                                )
                        }
                    </p>
                    <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                        En cliquant sur <span className="text-[#3A416F] font-bold">« Annuler »</span> aucun changement ne sera appliqué à ton abonnement et tu continueras à profiter des avantages Premium.
                    </p>
                </div>
            </ConfirmationModal>
            {showSuccessMessage && (
                <>
                    <div className={`w-full max-w-[564px] mx-auto ${successPlan === 'starter' && !paymentMethod ? "mb-4" : "mb-6"}`}>
                        <ModalMessage
                            variant="success"
                            title={
                                successPlan === 'starter'
                                    ? (paymentMethod ? "Changement d’abonnement pris en compte" : "Moyen de paiement supprimé")
                                    : isUndoingDowngrade
                                    ? "Annulation prise en compte !"
                                    : isCardReadded
                                    ? "Moyen de paiement enregistré"
                                    : isTrialActive
                                    ? "Félicitations !"
                                    : "Félicitations !"
                            }
                            description={
                                successPlan === 'starter'
                                    ? (
                                        paymentMethod ? (
                                            <span>
                                                Tu passeras à un abonnement Starter dès la fin de ta période d’abonnement Premium actuelle, soit le <span className="font-bold text-[#006646]">{formattedEndDate}</span>.
                                                <>
                                                    {" "}
                                                    <button
                                                        onClick={() => {
                                                            setIsUndoingDowngrade(true);
                                                            setSelectedPlan('premium');
                                                            // Optimistic update
                                                            setSuccessPlan('premium');
                                                            processUpdate({ isUndo: true });
                                                        }}
                                                        className="underline hover:text-[#207227] font-semibold cursor-pointer text-inherit transition-colors"
                                                    >
                                                        Annuler ce changement
                                                    </button>
                                                    .
                                                </>
                                            </span>
                                        ) : (
                                            <span>
                                                Ton moyen de paiement a été supprimé avec succès. Aucune coordonnée bancaire n’est désormais enregistrée sur ton compte. Tu continueras à profiter des avantages de ton abonnement Premium jusqu’au <span className="font-bold text-[#006646]">{formattedEndDate}</span>. Après cette date, ton compte passera automatiquement à l’abonnement Starter.
                                            </span>
                                        )
                                    )
                                    : isUndoingDowngrade
                                    ? "Suite à ton annulation, nous te confirmons que ton abonnement Premium sera renouvelé automatiquement à l’issue de la période d’abonnement actuelle."
                                    : isCardReadded
                                    ? (
                                        <span>
                                            Ton moyen de paiement a bien été enregistré. Ton abonnement Premium sera automatiquement renouvelé à l’issue de ta période en cours, soit le <span className="font-bold text-[#006646]">{formattedEndDate}</span>.
                                        </span>
                                    )
                                    : isTrialActive
                                    ? `Ton moyen de paiement a bien été ajouté. Tu pourras continuer à bénéficier des avantages Premium une fois les ${trialDays} jours offerts passés.`
                                    : "Ton abonnement a été modifié avec succès. Tu as maintenant accès à l’ensemble des fonctionnalités d’un abonnement Premium."
                            }
                        />
                    </div>
                    {successPlan === 'starter' && !paymentMethod && (
                        <div className="mb-6 w-full max-w-[564px] mx-auto">
                            <ModalMessage
                                variant="info"
                                title="Tu souhaites conserver ton abonnement Premium ?"
                                description={
                                    <span>
                                        Rien de plus simple, il te suffit d’ajouter un moyen de paiement avant le <span className="font-bold text-[#6660E4]">{formattedEndDate}</span>.
                                    </span>
                                }
                            />
                        </div>
                    )}
                </>
            )}
            {
                showModalMessage && !showSuccessMessage && (
                    <div className="mb-6 w-full max-w-[564px] mx-auto">
                        <ModalMessage
                            variant={successMessage.variant}
                            title={successMessage.title}
                            description={successMessage.description}
                        />
                    </div>
                )
            }
            {!isPremiumUser && !isTrialActive && !hasTrialHistory && !showSuccessMessage && !showModalMessage && (
                <div className="mb-6 w-full max-w-[564px] mx-auto">
                    <ModalMessage
                        variant="success"
                        title={
                            <div className="flex items-center gap-1.5">
                                <img src="/icons/gift.svg" alt="" className="h-[18px] w-auto inline-block" />
                                <span>Essaye Premium gratuitement !</span>
                            </div>
                        }
                        description={`Bonne nouvelle ! Tu peux bénéficier de ${trialDays} jours offerts pour tester gratuitement l’abonnement Premium. C’est sans engagement et tu n’as même pas besoin de renseigner un moyen de paiement.`}
                    />
                </div>
            )}

            {!isPremiumUser && !isTrialActive && hasTrialHistory && !showSuccessMessage && !showModalMessage && (
                <div className="mb-6 w-full max-w-[564px] mx-auto">
                    {isCardExpired ? (
                        <ModalMessage
                            variant="error"
                            title="Ton abonnement Premium n’a pas pu être renouvelé"
                            description={`Ton moyen de paiement est arrivé à expiration. Ton accès est temporairement limité à ${starterTrainingCountText} de ${starterMaxExercises} exercices. Pas de stress, ajoute un moyen de paiement dès maintenant pour réactiver ton abonnement Premium.`}
                        />
                    ) : hasPaidHistory ? (
                        <ModalMessage
                            variant="info"
                            title="Ton abonnement Premium a pris fin"
                            description={`Ton accès est maintenant limité à ${starterTrainingCountText} de ${starterMaxExercises} exercices mais tu peux réactiver ton abonnement Premium à tout moment.`}
                        />
                    ) : (isTrialEndedWithoutCard && isWithin7DaysAfterTrial) ? (
                        <ModalMessage
                            variant="info"
                            title={`Ton essai de ${trialDays} jours est terminé`}
                            description={`Étant donné qu’aucun moyen de paiement n’a été ajouté, tu es automatiquement passé à un abonnement Starter. Ton accès est maintenant limité à ${starterMaxTrainings} entraînement${starterMaxTrainings > 1 ? 's' : ''} de ${starterMaxExercises} exercices mais tu peux réactiver ton abonnement Premium à tout moment.`}
                        />
                    ) : null}
                </div>
            )}

            {isTrialActive && !showSuccessMessage && (
                <div className={`w-full max-w-[564px] mx-auto ${!paymentMethod && !isTrialCancelled ? "mb-4" : "mb-6"}`}>
                    {isTrialCancelled ? (
                        <ModalMessage
                            variant="success"
                            title="Changement d’abonnement pris en compte"
                            description={
                                <span>
                                    Tu passeras à un abonnement Starter dès la fin de ton essai Premium, soit le{" "}
                                    <span className="font-bold text-[#006646]">{trialEndFormatted || formattedEndDate}</span>.
                                    <>
                                        {" "}
                                        <button
                                            onClick={() => {
                                                setIsUndoingDowngrade(true);
                                                setSelectedPlan('premium');
                                                setSuccessPlan('premium');
                                                processUpdate({ isUndo: true });
                                            }}
                                            className="underline hover:text-[#207227] font-semibold cursor-pointer text-inherit transition-colors"
                                        >
                                            Annuler ce changement
                                        </button>
                                        .
                                    </>
                                </span>
                            }
                        />
                    ) : (
                        <ModalMessage
                            variant="success"
                            title={
                                <div className="flex items-center gap-1.5">
                                    <img src="/icons/gift.svg" alt="" className="h-[18px] w-auto inline-block" />
                                    <span>Essai Premium est en cours...</span>
                                </div>
                            }
                            description={`Tu profites actuellement de ${trialDays} jours offerts pour tester l’abonnement Premium. Nous espérons que tout se passe bien !`}
                        />
                    )}
                </div>
            )}

            {isTrialActive && !paymentMethod && !isTrialCancelled && (
                <div className="mb-6 w-full max-w-[564px] mx-auto">
                    <ModalMessage
                        variant="info"
                        title={`Ton essai se termine le : ${trialEndFormatted}`}
                        description="Si tu souhaites continuer à profiter de tes avantages Premium sans interruption après cette date, pense à ajouter un moyen de paiement."
                    />
                </div>
            )}
            {showToggle && (
                <div className="flex items-center justify-center gap-[10px] mb-4">
                    <button
                        type="button"
                        onClick={() => setInterval("monthly")}
                        className={`text-[15px] sm:text-[16px] transition-colors cursor-pointer select-none ${
                            interval === "monthly"
                                ? "text-[#3A416F] font-bold"
                                : "text-[#5D6494] font-semibold hover:text-[#3A416F]"
                        }`}
                    >
                        Mensuel
                    </button>

                    <ToggleSwitch
                        checked={interval === "yearly"}
                        onCheckedChange={(checked) => setInterval(checked ? "yearly" : "monthly")}
                        isAdmin={false}
                        ariaLabel="Basculer entre abonnement mensuel et annuel"
                    />

                    <button
                        type="button"
                        onClick={() => setInterval("yearly")}
                        className={`text-[15px] sm:text-[16px] transition-colors cursor-pointer select-none ${
                            interval === "yearly"
                                ? "text-[#3A416F] font-bold"
                                : "text-[#5D6494] font-semibold hover:text-[#3A416F]"
                        }`}
                    >
                        Annuel
                    </button>

                    {discountPercent > 0 && (
                        <span className="text-[10px] font-bold text-[#00D591] bg-[#DCFAF1] px-[10px] py-[2px] rounded-full h-[20px] inline-flex items-center justify-center select-none whitespace-nowrap leading-none">
                            Économise {discountPercent} %
                        </span>
                    )}
                </div>
            )}
            <div className="w-full max-w-[564px] mx-auto space-y-4 mb-0">
                <PlanOption
                    title="Abonnement Starter"
                    icon="/icons/diamant_starter.svg"
                    price="Gratuit"
                    period=""
                    isSelected={selectedPlan === "starter"}
                    onSelect={() => {
                        setSelectedPlan("starter");
                        setShowModalMessage(false);
                    }}
                />
                <PlanOption
                    title="Abonnement Premium"
                    icon="/icons/diamant_premium.svg"
                    price={`${currentPrice} €`}
                    period={currentPeriod}
                    isSelected={selectedPlan === "premium"}
                    onSelect={() => {
                        setSelectedPlan("premium");
                        setShowModalMessage(false);
                    }}
                />
            </div>

            {
                (selectedPlan === 'premium' || paymentMethod) && (
                    <div className="w-full max-w-[564px] mx-auto mt-[20px] mb-[40px]">
                        {paymentMethod && !isAddingMethod ? (
                            <PaymentMethodCard
                                brand={paymentMethod.brand}
                                last4={paymentMethod.last4}
                                expMonth={paymentMethod.exp_month}
                                expYear={paymentMethod.exp_year}
                                walletType={paymentMethod.wallet_type}
                                onEdit={handleEditPaymentMethod}
                                onDelete={handleDeletePaymentMethod}
                                error={paymentError}
                            />
                        ) : (
                            <div className="w-full rounded-[8px] border-[2px] border-dashed border-[#A1A5FD] hover:border-[#7069FA] transition-colors overflow-hidden">
                                {!isAddingMethod ? (
                                    <button
                                        onClick={() => handleStartSetup()}
                                        type="button"
                                        className="w-full h-[60px] text-[#A1A5FD] hover:text-[#7069FA] transition-colors text-[16px] font-semibold flex items-center justify-center cursor-pointer bg-transparent"
                                    >
                                        + Ajouter un moyen de paiement
                                    </button>
                                ) : (
                                    <div ref={paymentFormRef} className="px-4 sm:px-6 pb-6 pt-[50px] bg-white relative">
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
                                                        borderRadius: '22px',
                                                        fontSizeBase: '16px',
                                                        colorTextSecondary: '#D7D4DC',
                                                        colorTextPlaceholder: '#D7D4DC',
                                                     },
                                                    rules: {
                                                        '.Input': {
                                                            borderRadius: '5px',
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
                                                    priceLabel={`${currentPrice} €${currentPeriod}`}
                                                    clientSecret={setupData.clientSecret}
                                                    plan={setupData.plan}
                                                    customerId={setupData.customerId}
                                                    subscriptionId={setupData.subscriptionId}
                                                    submitButtonText={paymentMethod || (isPremiumUser && !isTrialActive) ? "Enregistrer" : "Démarrer mon abonnement"}
                                                    mode={setupData.mode}
                                                    onReady={scrollToPaymentForm}
                                                    onSuccess={async (newPaymentMethodId?: string) => {
                                                        // Prevent race condition with useEffect fetching stale data
                                                        lastActionTime.current = Date.now();
                                                        const wasAlreadyPremium = isPremiumUser && !isTrialActive;

                                                        // Always set as default to ensure subscription is updated/reactivated
                                                        if (newPaymentMethodId) {
                                                            try {
                                                                const simulatedWallet = typeof window !== 'undefined' ? sessionStorage.getItem('last_simulated_wallet') : null;
                                                                await fetch('/api/user/payment-methods', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ paymentMethodId: newPaymentMethodId, walletType: simulatedWallet }),
                                                                });
                                                            } catch (err) {
                                                                console.error("Failed to set default payment method", err);
                                                            }
                                                        }

                                                        await fetchPaymentMethod();
                                                        // Trigger update to sync subscription status immediately
                                                        await refreshUser();
                                                        window.dispatchEvent(new Event('paymentMethodUpdated'));

                                                        if (paymentMethod) {
                                                            // Updated existing
                                                            if (!isPremiumUser) {
                                                                setSuccessMessage({
                                                                    title: "Moyen de paiement enregistré avec succès",
                                                                    description: "Ton moyen de paiement a bien été enregistré. Tu peux désormais réactiver ton abonnement Premium à tout moment.",
                                                                    variant: "success"
                                                                });
                                                            } else {
                                                                setSuccessMessage({
                                                                    title: "Moyen de paiement modifié avec succès",
                                                                    description: "Ton changement de moyen de paiement a bien été pris en compte. Ce nouveau moyen de paiement sera utilisé pour le prochain prélèvement.",
                                                                    variant: "success"
                                                                });
                                                            }
                                                            setShowModalMessage(true);
                                                        } else {
                                                            if (wasAlreadyPremium) {
                                                                try {
                                                                    const subRes = await fetch(`/api/user/subscription-details?t=${Date.now()}`);
                                                                    if (subRes.ok) {
                                                                        const subData = await subRes.json();
                                                                        if (subData?.current_period_end) {
                                                                            setSubscriptionEndDate(subData.current_period_end);
                                                                        }
                                                                    }
                                                                } catch (e) {
                                                                    console.error("Failed to fetch sub details after adding card", e);
                                                                }
                                                                setIsCardReadded(true);
                                                                setIsUndoingDowngrade(false);
                                                            } else {
                                                                setIsCardReadded(false);
                                                            }

                                                            setSelectedPlan('premium');
                                                            setSuccessPlan('premium');
                                                            setShowSuccessMessage(true);
                                                        }

                                                        setIsAddingMethod(false);
                                                    }}

                                                />
                                            </Elements>
                                        ) : (
                                            <PaymentFormSkeleton />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            }

            <div className={`flex justify-center w-full ${selectedPlan === "starter" ? "mt-[32px]" : ""}`}>
                <CTAButton
                    onClick={handleUpdate}
                    disabled={isCurrentPlan || (selectedPlan === 'premium' && (!paymentMethod || isCardExpired))}
                    loading={loading}
                    className="w-full max-w-[368px] sm:w-auto sm:max-w-none px-[30px] font-semibold bg-[#F4F5FE] text-[#7069FA] hover:bg-[#EBEDFE]"
                >
                    Mettre à jour
                </CTAButton>
            </div>
        </div >
    );
}
