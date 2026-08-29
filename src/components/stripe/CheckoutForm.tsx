"use client";

import { useEffect, useMemo, useState } from "react";
import {
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    ExpressCheckoutElement,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import InfoTooltipAdornment from "@/components/account/fields/InfoTooltipAdornment";
import ErrorMessage from "@/components/ui/ErrorMessage";

/* eslint-disable @next/next/no-img-element */

interface CheckoutFormProps {
    priceLabel: string;
    clientSecret: string;
    plan: string;
    customerId: string | null;
    subscriptionId: string | null;
    onSuccess?: (paymentMethodId?: string) => void;
    submitButtonText?: string;
    mode?: 'setup' | 'payment';
}

const ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#2E3271',
            fontFamily: 'Quicksand, system-ui, sans-serif',
            fontWeight: '600',
            '::placeholder': {
                color: '#D7D4DC',
            },
        },
        invalid: {
            color: '#df1b41',
        },
    },
};

export default function CheckoutForm(props: CheckoutFormProps) {
    const { priceLabel, clientSecret, plan, customerId, subscriptionId, submitButtonText = "Démarrer mon abonnement", mode = 'setup' } = props;
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingWallet, setLoadingWallet] = useState<'apple_pay' | 'google_pay' | null>(null);
    const [accepted, setAccepted] = useState(false);
    const [isExpressAvailable, setIsExpressAvailable] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Track field completion for validation
    const [cardNumberComplete, setCardNumberComplete] = useState(false);
    const [hasCardNumberValue, setHasCardNumberValue] = useState(false);
    const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
    const [cardCvcComplete, setCardCvcComplete] = useState(false);

    // Track focus for styling
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const expressCheckoutOptions = useMemo(() => ({
        buttonType: {
            applePay: isMobile ? ('plain' as const) : ('buy' as const),
            googlePay: isMobile ? ('plain' as const) : ('pay' as const),
        },
        buttonTheme: {
            applePay: 'black' as const,
            googlePay: 'white' as const,
        },
        buttonHeight: 44,
        borderRadius: 22,
        paymentMethods: {
            applePay: 'auto' as const,
            googlePay: 'auto' as const,
            link: 'never' as const,
        },
        layout: {
            maxColumns: 1,
            maxRows: 2,
        },
    }), [isMobile]);

    const handleExpressReady = ({ availablePaymentMethods }: { availablePaymentMethods: any }) => {
        if (availablePaymentMethods && (availablePaymentMethods.applePay || availablePaymentMethods.googlePay)) {
            setIsExpressAvailable(true);
        }
    };

    const handleExpressConfirm = async () => {
        if (!stripe || !elements) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            if (mode === 'payment') {
                const { error, paymentIntent } = await stripe.confirmPayment({
                    elements,
                    clientSecret,
                    confirmParams: {
                        return_url: `${window.location.origin}/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`,
                    },
                    redirect: 'if_required',
                });

                if (error) {
                    setErrorMessage(error.message ?? "Une erreur est survenue lors du paiement");
                    setLoading(false);
                } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
                    if (props.onSuccess) {
                        const paymentMethodId = typeof paymentIntent.payment_method === 'string'
                            ? paymentIntent.payment_method
                            : paymentIntent.payment_method?.id;
                        props.onSuccess(paymentMethodId);
                    } else {
                        router.push(`/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`);
                    }
                } else {
                    setErrorMessage("Le paiement n'a pas pu être confirmé. Merci de réessayer.");
                    setLoading(false);
                }
            } else {
                const { error, setupIntent } = await stripe.confirmSetup({
                    elements,
                    clientSecret,
                    confirmParams: {
                        return_url: `${window.location.origin}/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`,
                    },
                    redirect: 'if_required',
                });

                if (error) {
                    setErrorMessage(error.message ?? "Une erreur est survenue lors de l'enregistrement");
                    setLoading(false);
                } else if (setupIntent && (setupIntent.status === 'succeeded' || setupIntent.status === 'processing')) {
                    if (props.onSuccess) {
                        const paymentMethodId = typeof setupIntent.payment_method === 'string'
                            ? setupIntent.payment_method
                            : setupIntent.payment_method?.id;
                        props.onSuccess(paymentMethodId);
                    } else {
                        router.push(`/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`);
                    }
                }
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Une erreur inattendue est survenue");
            setLoading(false);
        }
    };

    const handleSimulatedExpress = async (wallet: 'apple_pay' | 'google_pay') => {
        if (!stripe) return;
        setLoadingWallet(wallet);
        setLoading(true);
        setErrorMessage(null);

        try {
            if (mode === 'payment') {
                const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: {
                            token: 'tok_visa',
                        },
                    },
                });

                if (error) {
                    setErrorMessage(error.message ?? "Une erreur est survenue lors du paiement");
                    setLoading(false);
                    setLoadingWallet(null);
                } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('last_simulated_wallet', wallet);
                    }
                    if (props.onSuccess) {
                        const paymentMethodId = typeof paymentIntent.payment_method === 'string'
                            ? paymentIntent.payment_method
                            : paymentIntent.payment_method?.id;
                        props.onSuccess(paymentMethodId);
                    } else {
                        router.push(`/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`);
                    }
                } else {
                    setErrorMessage("Le paiement n'a pas pu être confirmé. Merci de réessayer.");
                    setLoading(false);
                    setLoadingWallet(null);
                }
            } else {
                const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                    payment_method: {
                        card: {
                            token: 'tok_visa',
                        },
                    },
                });

                if (error) {
                    setErrorMessage(error.message ?? "Une erreur est survenue lors de l'enregistrement");
                    setLoading(false);
                    setLoadingWallet(null);
                } else {
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('last_simulated_wallet', wallet);
                    }
                    if (props.onSuccess) {
                        const paymentMethodId = typeof setupIntent?.payment_method === 'string'
                            ? setupIntent.payment_method
                            : setupIntent?.payment_method?.id;
                        props.onSuccess(paymentMethodId);
                    } else {
                        router.push(`/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`);
                    }
                }
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Une erreur inattendue est survenue");
            setLoading(false);
            setLoadingWallet(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !accepted) {
            return;
        }

        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) return;

        setLoadingWallet(null);
        setLoading(true);
        setErrorMessage(null);

        try {
            if (mode === 'payment') {
                const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardNumberElement,
                    },
                });

                if (error) {
                    setErrorMessage(error.message ?? "Une erreur est survenue lors du paiement");
                    setLoading(false);
                } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('last_simulated_wallet');
                    }
                    if (props.onSuccess) {
                        const paymentMethodId = typeof paymentIntent.payment_method === 'string'
                            ? paymentIntent.payment_method
                            : paymentIntent.payment_method?.id;
                        props.onSuccess(paymentMethodId);
                    } else {
                        router.push(`/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`);
                    }
                } else {
                    setErrorMessage("Le paiement n'a pas pu être confirmé. Merci de réessayer.");
                    setLoading(false);
                }
            } else {
                // Setup Mode (Trial)
                const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                    payment_method: {
                        card: cardNumberElement,
                    },
                });

                if (error) {
                    setErrorMessage(error.message ?? "Une erreur est survenue lors du paiement");
                    setLoading(false);
                } else {
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('last_simulated_wallet');
                    }
                    if (props.onSuccess) {
                        const paymentMethodId = typeof setupIntent?.payment_method === 'string'
                            ? setupIntent.payment_method
                            : setupIntent?.payment_method?.id;
                        props.onSuccess(paymentMethodId);
                    } else {
                        router.push(`/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`);
                    }
                }
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Une erreur inattendue est survenue");
            setLoading(false);
        }
    };

    const isFormComplete = cardNumberComplete && cardExpiryComplete && cardCvcComplete && accepted;
    const btnDisabled = !stripe || !elements || !isFormComplete || loading;

    return (
        <div className="w-full">
            {/* Express Checkout (Apple Pay, Google Pay) - Réel & Simulation de prévisualisation */}
            <div className="w-full max-w-[368px] mx-auto mb-[25px]">
                {/* Élément Stripe réel */}
                <ExpressCheckoutElement
                    onConfirm={handleExpressConfirm}
                    onReady={handleExpressReady}
                    options={expressCheckoutOptions}
                />

                {/* Simulation visuelle pour validation du design et test du flux */}
                {!isExpressAvailable && (
                    <div className="flex flex-col gap-[20px] w-full">
                        {/* Bouton Apple Pay simulé */}
                        <button
                            type="button"
                            onClick={() => {
                                if (loading) return;
                                handleSimulatedExpress('apple_pay');
                            }}
                            className="w-full h-[44px] px-6 rounded-full bg-black text-white font-semibold text-[15px] flex items-center justify-center gap-1.5 cursor-pointer select-none"
                        >
                            {loadingWallet === 'apple_pay' ? (
                                <span className="text-[15px] font-semibold text-white">Validation…</span>
                            ) : (
                                <>
                                    <span className="hidden sm:inline">Payer avec</span>
                                    <div className="flex items-center gap-1">
                                        <svg viewBox="0 0 384 512" fill="currentColor" className="w-[14px] h-[17px] text-white -mt-[2px]">
                                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                        </svg>
                                        <span className="font-bold text-[17px] text-white tracking-tight -mt-[1px]">Pay</span>
                                    </div>
                                </>
                            )}
                        </button>

                        {/* Bouton Google Pay simulé */}
                        <button
                            type="button"
                            onClick={() => {
                                if (loading) return;
                                handleSimulatedExpress('google_pay');
                            }}
                            className="w-full h-[44px] px-6 rounded-full bg-white text-[#3c4043] border border-[#D7D4DC] font-semibold text-[15px] flex items-center justify-center gap-1.5 cursor-pointer select-none"
                        >
                            {loadingWallet === 'google_pay' ? (
                                <span className="text-[15px] font-semibold text-[#3c4043]">Validation…</span>
                            ) : (
                                <>
                                    <span className="hidden sm:inline">Payer avec</span>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                        </svg>
                                        <span className="font-bold text-[17px] text-[#3c4043] tracking-tight -mt-[1px]">Pay</span>
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Séparateur */}
                <div className="relative my-[25px] flex items-center justify-center w-full">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#ECE9F1]" />
                    </div>
                    <div className="relative bg-white px-3 text-[14px] font-semibold text-[#D7D4DC]">
                        ou continue avec
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
            <div className="w-full max-w-[368px] mx-auto mb-[30px]">
                {/* Numéro de carte */}
                <div className="mb-5">
                    <label className="text-[16px] text-[#2E3271] font-bold mb-[8px] block">
                        Numéro de carte
                    </label>
                    <div
                        className={`h-[45px] w-full rounded-[5px] bg-white border px-[15px] flex items-center gap-3 transition-all duration-150 ${focusedField === "cardNumber"
                            ? "border-transparent ring-2 ring-[#A1A5FD]"
                            : "border-[#D7D4DC] hover:border-[#C2BFC6]"
                            }`}
                    >
                        <div className="flex-1">
                            <CardNumberElement
                                options={{ ...ELEMENT_OPTIONS, showIcon: true, disableLink: true }}
                                className="w-full"
                                onChange={(e) => {
                                    setCardNumberComplete(e.complete);
                                    setHasCardNumberValue(!e.empty);
                                }}
                                onFocus={() => setFocusedField("cardNumber")}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                        {!hasCardNumberValue && (
                            <div className="flex items-center gap-1 shrink-0 transition-opacity duration-150">
                                <img src="/icons/visa.svg" alt="Visa" className="h-[20px] w-auto" />
                                <img src="/icons/mastercard.svg" alt="Mastercard" className="h-[20px] w-auto" />
                                <img src="/icons/cb.svg" alt="CB" className="h-[20px] w-auto" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Date d'expiration */}
                <div className="mb-5">
                    <label className="text-[16px] text-[#2E3271] font-bold mb-[8px] block">
                        Date d’expiration
                    </label>
                    <div
                        className={`h-[45px] w-full rounded-[5px] bg-white border px-[15px] flex items-center transition-all duration-150 ${focusedField === "cardExpiry"
                            ? "border-transparent ring-2 ring-[#A1A5FD]"
                            : "border-[#D7D4DC] hover:border-[#C2BFC6]"
                            }`}
                    >
                        <CardExpiryElement
                            options={ELEMENT_OPTIONS}
                            className="w-full"
                            onChange={(e) => setCardExpiryComplete(e.complete)}
                            onFocus={() => setFocusedField("cardExpiry")}
                            onBlur={() => setFocusedField(null)}
                        />
                    </div>
                </div>

                {/* CVC - Largeur 179px */}
                <div className="w-[179px] mb-6">
                    <label className="text-[16px] text-[#2E3271] font-bold mb-[8px] block">
                        Code de sécurité
                    </label>
                    <div className="relative">
                        <div
                            className={`h-[45px] w-full rounded-[5px] bg-white border px-[15px] flex items-center transition-all duration-150 ${focusedField === "cardCvc"
                                ? "border-transparent ring-2 ring-[#A1A5FD]"
                                : "border-[#D7D4DC] hover:border-[#C2BFC6]"
                                }`}
                        >
                            <CardCvcElement
                                options={ELEMENT_OPTIONS}
                                className="w-full"
                                onChange={(e) => setCardCvcComplete(e.complete)}
                                onFocus={() => setFocusedField("cardCvc")}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                        <div
                            className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                            style={{ left: "calc(100% + 10px)" }}
                        >
                            <div className="pointer-events-auto">
                                <InfoTooltipAdornment
                                    message="Ce code à 3 chiffres se trouve à l'arrière de la carte sur la zone de signature."
                                    iconSize={18}
                                    ariaLabel="Aide Code de sécurité"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <ErrorMessage
                        title="Erreur de paiement"
                        description={errorMessage}
                        className="mb-4"
                    />
                )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none text-[14px] font-semibold text-[#5D6494] mb-5 w-full max-w-[564px] mx-auto">
                <div className="relative w-[15px] h-[15px] shrink-0 mt-[3px]">
                    <input
                        id="subscription"
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                        className="peer sr-only"
                    />
                    <img
                        src="/icons/checkbox_unchecked.svg"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-[15px] h-[15px] peer-checked:hidden"
                    />
                    <img
                        src="/icons/checkbox_checked.svg"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-[15px] h-[15px] hidden peer-checked:block"
                    />
                </div>
                <span className="leading-relaxed">
                    Je comprends que je m’abonne à un service facturé{" "}
                    <span className="font-bold">{priceLabel}</span>, renouvelé automatiquement à la fin de la période d’essai et annulable à tout moment. J’autorise le prélèvement automatique sur ma carte. Je demande l’accès immédiat au service et je reconnais que je renonce à mon droit de rétractation.
                </span>
            </label>

            <div className="mt-0 flex justify-center w-full">
                <CTAButton
                    type="submit"
                    disabled={btnDisabled}
                    loading={loading && !loadingWallet}
                    loadingText="Validation…"
                    className="w-full sm:w-auto h-[48px] px-[20px] rounded-[25px] text-[16px] font-semibold"
                >
                    {submitButtonText}
                </CTAButton>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-semibold text-[#5D6494]">
                <img src="/icons/cadena_stripe.svg" alt="Sécurisé" className="h-[16px] w-auto mt-[-3px]" />
                <span>Paiement 100% sécurisé par</span>
                <img src="/icons/logo_stripe.svg" alt="Stripe" className="h-[16px] w-auto ml-[-3px]" />
            </div>
        </form>
    </div>
    );
}
