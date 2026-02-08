"use client";

import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";

// Remplacez par votre clé publique Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeWrapperProps {
    priceLabel: string;
    plan: string;
    email: string;
    userId: string;
}

export default function StripeWrapper({ priceLabel, plan, email, userId }: StripeWrapperProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!email || !userId) return;

        // Créer le PaymentIntent / Sub dès que la page charge
        fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, userId }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setClientSecret(data.clientSecret);
                    setCustomerId(data.customerId);
                    setSubscriptionId(data.subscriptionId);
                }
            })
            .catch((err) => setError("Erreur réseau: impossible d'initialiser le paiement."));
    }, [email, userId]);

    if (error) {
        return <div className="text-red-500 font-semibold p-4 bg-red-50 rounded-lg">{error}</div>;
    }

    if (!clientSecret) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7069FA]"></div>
            </div>
        );
    }

    const options = {
        clientSecret,
        fonts: [
            {
                cssSrc: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap',
            },
        ],
        appearance: {
            theme: 'flat' as const,
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
                borderColor: '#D7D4DC',
            },
            rules: {
                '.Input': {
                    border: '1px solid #D7D4DC',
                    boxShadow: 'none',
                    padding: '10px 15px',
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '1.5',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                },
                '.Input:hover': {
                    borderColor: '#C2BFC6',
                },
                '.Input:focus': {
                    borderColor: 'transparent',
                    boxShadow: '0 0 0 2px #A1A5FD',
                    outline: 'none',
                },
                '.Label': {
                    fontWeight: '600',
                    color: '#2E3271',
                    marginBottom: '8px',
                    fontSize: '16px',
                },
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
                priceLabel={priceLabel}
                clientSecret={clientSecret}
                plan={plan}
                customerId={customerId}
                subscriptionId={subscriptionId}
            />
        </Elements>
    );
}
