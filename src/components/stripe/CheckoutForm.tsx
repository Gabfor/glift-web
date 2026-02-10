"use client";

import { useState } from "react";
import {
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { StripeCardNumberElement } from "@stripe/stripe-js";
import CTAButton from "@/components/CTAButton";
import InfoTooltipAdornment from "@/components/account/fields/InfoTooltipAdornment";

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
    const [accepted, setAccepted] = useState(false);

    // Track field completion for validation
    const [cardNumberComplete, setCardNumberComplete] = useState(false);
    const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
    const [cardCvcComplete, setCardCvcComplete] = useState(false);

    // Track focus for styling
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !accepted) {
            return;
        }

        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) return;

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
                    if (props.onSuccess) {
                        const paymentMethodId = typeof paymentIntent.payment_method === 'string'
                            ? paymentIntent.payment_method
                            : paymentIntent.payment_method?.id;
                        props.onSuccess(paymentMethodId);
                    } else {
                        router.push(`/inscription/informations?payment_success=true&plan=${plan}&customer_id=${customerId ?? ''}&subscription_id=${subscriptionId ?? ''}`);
                    }
                } else {
                    setErrorMessage("Le paiement n'a pas pu être confirmé. Veuillez réessayer.");
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
    const arrowIcon = btnDisabled ? "/icons/arrow_grey.svg" : "/icons/arrow.svg";

    return (
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
                                onChange={(e) => setCardNumberComplete(e.complete)}
                                onFocus={() => setFocusedField("cardNumber")}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <img src="/icons/visa.svg" alt="Visa" className="h-[20px] w-auto" />
                            <img src="/icons/mastercard.svg" alt="Mastercard" className="h-[20px] w-auto" />
                            <img src="/icons/cb.svg" alt="CB" className="h-[20px] w-auto" />
                        </div>
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
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium">
                        {errorMessage}
                    </div>
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

            <div className="mt-0 flex justify-center">
                <CTAButton
                    type="submit"
                    disabled={btnDisabled}
                    loading={loading}
                    loadingText="Validation…"
                    className="h-[48px] px-[20px] rounded-[25px] text-[16px] font-semibold"
                >
                    <>
                        {submitButtonText}
                        <img
                            src={arrowIcon}
                            alt=""
                            aria-hidden="true"
                            className="w-[20px] h-[20px]"
                        />
                    </>
                </CTAButton>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-semibold text-[#5D6494]">
                <img src="/icons/cadena_stripe.svg" alt="Sécurisé" className="h-[16px] w-auto mt-[-3px]" />
                <span>Paiement 100% sécurisé par</span>
                <img src="/icons/logo_stripe.svg" alt="Stripe" className="h-[16px] w-auto ml-[-3px]" />
            </div>
        </form>
    );
}
