import { useUser } from "@/context/UserContext";
import CTAButton from "@/components/CTAButton";
import Tooltip from "@/components/Tooltip";
import { useEffect, useState } from "react";

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
                        <img src={brandIcon} alt={brand} className="h-full w-auto object-contain" />
                    ) : (
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{brand}</span>
                    )}
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[16px] font-semibold text-[#2E3271]">
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
                    className="text-[15px] font-semibold text-[#7069FA] hover:text-[#5a52cc] transition-colors"
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

interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
}

export default function SubscriptionManager() {
    const { isPremiumUser, isLoading } = useUser();
    const [selectedPlan, setSelectedPlan] = useState<"starter" | "premium">("starter");
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

    // Sync state with user profile when loaded
    useEffect(() => {
        setSelectedPlan(isPremiumUser ? "premium" : "starter");
    }, [isPremiumUser]);

    useEffect(() => {
        async function fetchPaymentMethod() {
            try {
                console.log("Fetching payment methods...");
                const res = await fetch('/api/user/payment-methods');
                console.log("Fetch status:", res.status);
                if (res.ok) {
                    const json = await res.json();
                    console.log("Fetch data:", json);
                    if (json.data && json.data.length > 0) {
                        setPaymentMethod(json.data[0]);
                    } else {
                        console.log("No payment methods found");
                    }
                }
            } catch (err) {
                console.error("Failed to fetch payment methods", err);
            }
        }
        if (isPremiumUser) {
            fetchPaymentMethod();
        }
    }, [isPremiumUser]);

    const isCurrentPlan =
        (isPremiumUser && selectedPlan === "premium") ||
        (!isPremiumUser && selectedPlan === "starter");

    const handleUpdate = async () => {
        setLoading(true);
        // TODO: Implement update logic
        setTimeout(() => {
            console.log("Update plan to:", selectedPlan);
            setLoading(false);
        }, 1000);
    };

    const handleDeletePaymentMethod = () => {
        console.log("Delete payment method");
        // Implement deletion logic
    };

    const handleEditPaymentMethod = () => {
        console.log("Edit payment method");
        // Implement edit logic
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

            <div className="mt-[20px] mb-[40px]">
                {selectedPlan === 'premium' && paymentMethod ? (
                    <PaymentMethodCard
                        brand={paymentMethod.brand}
                        last4={paymentMethod.last4}
                        expMonth={paymentMethod.exp_month}
                        expYear={paymentMethod.exp_year}
                        onEdit={handleEditPaymentMethod}
                        onDelete={handleDeletePaymentMethod}
                    />
                ) : (
                    <button
                        type="button"
                        className="w-full h-[60px] rounded-[8px] border-[2px] border-dashed border-[#A1A5FD] text-[#A1A5FD] hover:border-[#7069FA] hover:text-[#7069FA] transition-colors text-[16px] font-semibold flex items-center justify-center cursor-pointer bg-transparent"
                    >
                        + Ajouter un mode de paiement
                    </button>
                )}
            </div>

            <div className="flex justify-center">
                <CTAButton
                    onClick={handleUpdate}
                    disabled={isCurrentPlan}
                    loading={loading}
                    className="px-[30px] font-semibold bg-[#F4F5FE] text-[#7069FA] hover:bg-[#EBEDFE]"
                >
                    Mettre à jour
                </CTAButton>
            </div>
        </div>
    );
}
