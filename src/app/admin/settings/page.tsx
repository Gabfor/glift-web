"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";
import CTAButton from "@/components/CTAButton";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import ImageUploader from "@/app/admin/components/ImageUploader";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import GliftLoader from "@/components/ui/GliftLoader";
import { cleanupOrphanedImages } from "./actions";

export default function AdminSettingsPage() {
    const [logoUrl, setLogoUrl] = useState<string>("");
    const [altText, setAltText] = useState<string>("");
    // Initial state for change detection
    const [initialLogoUrl, setInitialLogoUrl] = useState<string>("");
    const [initialAltText, setInitialAltText] = useState<string>("");

    const [trialDays, setTrialDays] = useState<string>("30");
    const [initialTrialDays, setInitialTrialDays] = useState<string>("30");

    // Premium Pricing settings
    const [premiumMonthlyEnabled, setPremiumMonthlyEnabled] = useState<string>("OUI");
    const [initialPremiumMonthlyEnabled, setInitialPremiumMonthlyEnabled] = useState<string>("OUI");
    const [premiumYearlyEnabled, setPremiumYearlyEnabled] = useState<string>("NON");
    const [initialPremiumYearlyEnabled, setInitialPremiumYearlyEnabled] = useState<string>("NON");
    const [premiumMonthlyPrice, setPremiumMonthlyPrice] = useState<string>("2,49");
    const [initialPremiumMonthlyPrice, setInitialPremiumMonthlyPrice] = useState<string>("2,49");
    const [premiumYearlyPrice, setPremiumYearlyPrice] = useState<string>("24,99");
    const [initialPremiumYearlyPrice, setInitialPremiumYearlyPrice] = useState<string>("24,99");
    const [premiumMonthlyStripeId, setPremiumMonthlyStripeId] = useState<string>("");
    const [initialPremiumMonthlyStripeId, setInitialPremiumMonthlyStripeId] = useState<string>("");
    const [premiumYearlyStripeId, setPremiumYearlyStripeId] = useState<string>("");
    const [initialPremiumYearlyStripeId, setInitialPremiumYearlyStripeId] = useState<string>("");

    const [starterMaxTrainings, setStarterMaxTrainings] = useState<string>("1");
    const [initialStarterMaxTrainings, setInitialStarterMaxTrainings] = useState<string>("1");

    const [starterMaxExercises, setStarterMaxExercises] = useState<string>("10");
    const [initialStarterMaxExercises, setInitialStarterMaxExercises] = useState<string>("10");

    const [contactEmail, setContactEmail] = useState<string>("");
    const [initialContactEmail, setInitialContactEmail] = useState<string>("");

    const [premiumPaymentStep, setPremiumPaymentStep] = useState<string>("disabled");
    const [initialPremiumPaymentStep, setInitialPremiumPaymentStep] = useState<string>("disabled");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupFeedback, setCleanupFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        logo: false,
        trial: true,
        premiumPricing: true,
        starterLimits: true,
        emails: true,
        raccourcis: true,
    });

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => {
            const isCurrentlyCollapsed = prev[section];
            const nextState: Record<string, boolean> = {};
            Object.keys(prev).forEach(key => {
                nextState[key] = true;
            });
            if (isCurrentlyCollapsed) {
                nextState[section] = false;
            }
            return nextState;
        });
    };

    const supabase = createClient();
    const settingsService = new SettingsService(supabase);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await settingsService.getSettings();
                const currentLogoUrl = settings["logo_url"] || "";
                const currentAltText = settings["logo_alt"] || "";

                setLogoUrl(currentLogoUrl);
                setAltText(currentAltText);
                setInitialLogoUrl(currentLogoUrl);
                setInitialAltText(currentAltText);

                // Fetch Trial Days
                const trialDaysValue = settings["trial_period_days"] || "30";
                setTrialDays(trialDaysValue);
                setInitialTrialDays(trialDaysValue);

                // Fetch Premium Pricing Settings
                const monthlyEnabledVal = settings["premium_monthly_enabled"] || "OUI";
                setPremiumMonthlyEnabled(monthlyEnabledVal);
                setInitialPremiumMonthlyEnabled(monthlyEnabledVal);

                const yearlyEnabledVal = settings["premium_yearly_enabled"] || "NON";
                setPremiumYearlyEnabled(yearlyEnabledVal);
                setInitialPremiumYearlyEnabled(yearlyEnabledVal);

                const monthlyPriceVal = settings["premium_monthly_price"] || "2,49";
                setPremiumMonthlyPrice(monthlyPriceVal);
                setInitialPremiumMonthlyPrice(monthlyPriceVal);

                const yearlyPriceVal = settings["premium_yearly_price"] || "24,99";
                setPremiumYearlyPrice(yearlyPriceVal);
                setInitialPremiumYearlyPrice(yearlyPriceVal);

                const monthlyStripeVal = settings["premium_monthly_stripe_id"] || "";
                setPremiumMonthlyStripeId(monthlyStripeVal);
                setInitialPremiumMonthlyStripeId(monthlyStripeVal);

                const yearlyStripeVal = settings["premium_yearly_stripe_id"] || "";
                setPremiumYearlyStripeId(yearlyStripeVal);
                setInitialPremiumYearlyStripeId(yearlyStripeVal);

                // Fetch Starter Limits
                const starterTrainingsValue = settings["starter_max_trainings"] || "1";
                setStarterMaxTrainings(starterTrainingsValue);
                setInitialStarterMaxTrainings(starterTrainingsValue);

                const starterExercisesValue = settings["starter_max_exercises"] || "10";
                setStarterMaxExercises(starterExercisesValue);
                setInitialStarterMaxExercises(starterExercisesValue);

                // Fetch Contact Email
                const contactEmailValue = settings["contact_email"] || "";
                setContactEmail(contactEmailValue);
                setInitialContactEmail(contactEmailValue);

                // Fetch Premium Payment Step
                const premiumPaymentStepValue = settings["premium_payment_step"] || "disabled";
                setPremiumPaymentStep(premiumPaymentStepValue);
                setInitialPremiumPaymentStep(premiumPaymentStepValue);

            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const hasChanges =
        logoUrl !== initialLogoUrl ||
        altText !== initialAltText ||
        trialDays !== initialTrialDays ||
        premiumMonthlyEnabled !== initialPremiumMonthlyEnabled ||
        premiumYearlyEnabled !== initialPremiumYearlyEnabled ||
        premiumMonthlyPrice !== initialPremiumMonthlyPrice ||
        premiumYearlyPrice !== initialPremiumYearlyPrice ||
        premiumMonthlyStripeId !== initialPremiumMonthlyStripeId ||
        premiumYearlyStripeId !== initialPremiumYearlyStripeId ||
        starterMaxTrainings !== initialStarterMaxTrainings ||
        starterMaxExercises !== initialStarterMaxExercises ||
        contactEmail !== initialContactEmail ||
        premiumPaymentStep !== initialPremiumPaymentStep ;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (logoUrl) {
                await settingsService.updateSetting("logo_url", logoUrl);
            }
            await settingsService.updateSetting("logo_alt", altText);

            await settingsService.updateSetting("trial_period_days", trialDays);
            await settingsService.updateSetting("premium_monthly_enabled", premiumMonthlyEnabled);
            await settingsService.updateSetting("premium_yearly_enabled", premiumYearlyEnabled);
            await settingsService.updateSetting("premium_monthly_price", premiumMonthlyPrice);
            await settingsService.updateSetting("premium_yearly_price", premiumYearlyPrice);
            await settingsService.updateSetting("premium_monthly_stripe_id", premiumMonthlyStripeId);
            await settingsService.updateSetting("premium_yearly_stripe_id", premiumYearlyStripeId);
            await settingsService.updateSetting("starter_max_trainings", starterMaxTrainings);
            await settingsService.updateSetting("starter_max_exercises", starterMaxExercises);
            await settingsService.updateSetting("contact_email", contactEmail);
            await settingsService.updateSetting("premium_payment_step", premiumPaymentStep);

            // Update initial state
            setInitialLogoUrl(logoUrl);
            setInitialAltText(altText);
            setInitialTrialDays(trialDays);
            setInitialPremiumMonthlyEnabled(premiumMonthlyEnabled);
            setInitialPremiumYearlyEnabled(premiumYearlyEnabled);
            setInitialPremiumMonthlyPrice(premiumMonthlyPrice);
            setInitialPremiumYearlyPrice(premiumYearlyPrice);
            setInitialPremiumMonthlyStripeId(premiumMonthlyStripeId);
            setInitialPremiumYearlyStripeId(premiumYearlyStripeId);
            setInitialStarterMaxTrainings(starterMaxTrainings);
            setInitialStarterMaxExercises(starterMaxExercises);
            setInitialContactEmail(contactEmail);
            setInitialPremiumPaymentStep(premiumPaymentStep);

        } catch (error) {
            console.error("Save failed", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <GliftLoader isAdmin />;
    }

    return (
        <main className="min-h-screen bg-transparent px-4 pt-[100px] md:pt-[140px] pb-[100px] flex justify-center">
            <div className="w-full max-w-3xl relative z-10">
                <h2 className="text-[24px] sm:text-[30px] font-bold text-[#3A416F] text-center mb-[40px]">
                    Paramètres
                </h2>

                <div className="flex flex-col gap-8 w-full">
                    {/* SECTION 1: LOGO */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => toggleSection("logo")}
                            className="flex justify-between items-center cursor-pointer group mb-[10px]"
                        >
                            <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                                Logo
                            </h3>
                            <div className="relative w-[18px] h-[18px]">
                                <Image
                                    src="/icons/chevron_bloc.svg"
                                    alt="Chevron"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.logo ? "rotate-180" : ""} group-hover:hidden`}
                                />
                                <Image
                                    src="/icons/chevron_bloc_hover.svg"
                                    alt="Chevron Hover"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.logo ? "rotate-180" : ""} hidden group-hover:block`}
                                />
                            </div>
                        </div>

                        {!collapsedSections.logo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                                {/* Logo Upload Section */}
                                <div className="flex flex-col gap-[10px]">
                                    <ImageUploader
                                        label="Logo"
                                        dimensions="294px x 70px"
                                        value={logoUrl}
                                        onChange={setLogoUrl}
                                        placeholder="Importer un fichier"
                                        bucket="logos"
                                        basePath=""
                                    />
                                </div>

                                {/* Alt Text Input */}
                                <div className="flex flex-col justify-end">
                                    <AdminTextField
                                        label="Alt logo"
                                        value={altText}
                                        onChange={setAltText}
                                        placeholder="Alt logo"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: PÉRIODE D'ESSAI */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => toggleSection("trial")}
                            className="flex justify-between items-center cursor-pointer group mb-[10px]"
                        >
                            <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                                Période d’essai
                            </h3>
                            <div className="relative w-[18px] h-[18px]">
                                <Image
                                    src="/icons/chevron_bloc.svg"
                                    alt="Chevron"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.trial ? "rotate-180" : ""} group-hover:hidden`}
                                />
                                <Image
                                    src="/icons/chevron_bloc_hover.svg"
                                    alt="Chevron Hover"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.trial ? "rotate-180" : ""} hidden group-hover:block`}
                                />
                            </div>
                        </div>

                        {!collapsedSections.trial && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                                <div>
                                    <AdminDropdown
                                        label="Durée de la période d’essai"
                                        placeholder="Sélectionner"
                                        sortStrategy="none"
                                        options={[
                                            { value: "0.0416667", label: "1 heure" },
                                            { value: "1", label: "1 jour" },
                                            { value: "7", label: "7 jours" },
                                            { value: "30", label: "30 jours" },
                                        ]}
                                        selected={trialDays}
                                        onSelect={setTrialDays}
                                    />
                                </div>
                                <div>
                                    <AdminDropdown
                                        label="Étape de paiement (premium)"
                                        placeholder="Sélectionner"
                                        sortStrategy="none"
                                        options={[
                                            { value: "enabled", label: "Activée" },
                                            { value: "disabled", label: "Désactivée" },
                                        ]}
                                        selected={premiumPaymentStep}
                                        onSelect={setPremiumPaymentStep}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION: PRIX D’UN ABONNEMENT PREMIUM */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => toggleSection("premiumPricing")}
                            className="flex justify-between items-center cursor-pointer group mb-[10px]"
                        >
                            <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                                Prix d’un abonnement Premium
                            </h3>
                            <div className="relative w-[18px] h-[18px]">
                                <Image
                                    src="/icons/chevron_bloc.svg"
                                    alt="Chevron"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.premiumPricing ? "rotate-180" : ""} group-hover:hidden`}
                                />
                                <Image
                                    src="/icons/chevron_bloc_hover.svg"
                                    alt="Chevron Hover"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.premiumPricing ? "rotate-180" : ""} hidden group-hover:block`}
                                />
                            </div>
                        </div>

                        {!collapsedSections.premiumPricing && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                                {/* Row 1: Activation */}
                                <div>
                                    <AdminDropdown
                                        label="Activer prix mensuel"
                                        placeholder="Sélectionner"
                                        sortStrategy="none"
                                        options={[
                                            { value: "OUI", label: "OUI" },
                                            { value: "NON", label: "NON" },
                                        ]}
                                        selected={premiumMonthlyEnabled}
                                        onSelect={setPremiumMonthlyEnabled}
                                    />
                                </div>
                                <div>
                                    <AdminDropdown
                                        label="Activer prix annuel"
                                        placeholder="Sélectionner"
                                        sortStrategy="none"
                                        options={[
                                            { value: "OUI", label: "OUI" },
                                            { value: "NON", label: "NON" },
                                        ]}
                                        selected={premiumYearlyEnabled}
                                        onSelect={setPremiumYearlyEnabled}
                                    />
                                </div>

                                {/* Row 2: Prix */}
                                <div>
                                    <AdminTextField
                                        label="Prix mensuel"
                                        value={premiumMonthlyEnabled === "OUI" ? premiumMonthlyPrice : ""}
                                        onChange={setPremiumMonthlyPrice}
                                        placeholder={premiumMonthlyEnabled === "OUI" ? "3,99" : "0,00"}
                                        disabled={premiumMonthlyEnabled !== "OUI"}
                                        className={premiumMonthlyEnabled !== "OUI" ? "bg-[#F7F8F9] !text-[#C2BFC6] border-[#ECE9F1] cursor-not-allowed hover:!border-[#ECE9F1] focus:!shadow-none placeholder:!text-[#C2BFC6]" : ""}
                                    />
                                </div>
                                <div>
                                    <AdminTextField
                                        label="Prix annuel"
                                        value={premiumYearlyEnabled === "OUI" ? premiumYearlyPrice : ""}
                                        onChange={setPremiumYearlyPrice}
                                        placeholder={premiumYearlyEnabled === "OUI" ? "39,99" : "0,00"}
                                        disabled={premiumYearlyEnabled !== "OUI"}
                                        className={premiumYearlyEnabled !== "OUI" ? "bg-[#F7F8F9] !text-[#C2BFC6] border-[#ECE9F1] cursor-not-allowed hover:!border-[#ECE9F1] focus:!shadow-none placeholder:!text-[#C2BFC6]" : ""}
                                    />
                                </div>

                                {/* Row 3: Stripe Price ID */}
                                <div>
                                    <AdminTextField
                                        label="ID du tarif Stripe"
                                        value={premiumMonthlyEnabled === "OUI" ? premiumMonthlyStripeId : ""}
                                        onChange={setPremiumMonthlyStripeId}
                                        placeholder={premiumMonthlyEnabled === "OUI" ? "price_..." : "0,00"}
                                        disabled={premiumMonthlyEnabled !== "OUI"}
                                        className={premiumMonthlyEnabled !== "OUI" ? "bg-[#F7F8F9] !text-[#C2BFC6] border-[#ECE9F1] cursor-not-allowed hover:!border-[#ECE9F1] focus:!shadow-none placeholder:!text-[#C2BFC6]" : ""}
                                    />
                                </div>
                                <div>
                                    <AdminTextField
                                        label="ID du tarif Stripe"
                                        value={premiumYearlyEnabled === "OUI" ? premiumYearlyStripeId : ""}
                                        onChange={setPremiumYearlyStripeId}
                                        placeholder={premiumYearlyEnabled === "OUI" ? "price_..." : "0,00"}
                                        disabled={premiumYearlyEnabled !== "OUI"}
                                        className={premiumYearlyEnabled !== "OUI" ? "bg-[#F7F8F9] !text-[#C2BFC6] border-[#ECE9F1] cursor-not-allowed hover:!border-[#ECE9F1] focus:!shadow-none placeholder:!text-[#C2BFC6]" : ""}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: LIMITES D'UN COMPTE STARTER */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => toggleSection("starterLimits")}
                            className="flex justify-between items-center cursor-pointer group mb-[10px]"
                        >
                            <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                                Limites d’un compte Starter
                            </h3>
                            <div className="relative w-[18px] h-[18px]">
                                <Image
                                    src="/icons/chevron_bloc.svg"
                                    alt="Chevron"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.starterLimits ? "rotate-180" : ""} group-hover:hidden`}
                                />
                                <Image
                                    src="/icons/chevron_bloc_hover.svg"
                                    alt="Chevron Hover"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.starterLimits ? "rotate-180" : ""} hidden group-hover:block`}
                                />
                            </div>
                        </div>

                        {!collapsedSections.starterLimits && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                                <div>
                                    <AdminDropdown
                                        label="Nombre d’entraînements inclus"
                                        placeholder="Sélectionner"
                                        sortStrategy="none"
                                        options={Array.from({ length: 10 }, (_, i) => ({
                                            value: String(i + 1),
                                            label: String(i + 1),
                                        }))}
                                        selected={starterMaxTrainings}
                                        onSelect={setStarterMaxTrainings}
                                    />
                                </div>
                                <div>
                                    <AdminDropdown
                                        label="Nombre d’exercices inclus"
                                        placeholder="Sélectionner"
                                        sortStrategy="none"
                                        options={Array.from({ length: 30 }, (_, i) => ({
                                            value: String(i + 1),
                                            label: String(i + 1),
                                        }))}
                                        selected={starterMaxExercises}
                                        onSelect={setStarterMaxExercises}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: EMAILS FONCTIONNELS */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => toggleSection("emails")}
                            className="flex justify-between items-center cursor-pointer group mb-[10px]"
                        >
                            <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                                Emails fonctionnels
                            </h3>
                            <div className="relative w-[18px] h-[18px]">
                                <Image
                                    src="/icons/chevron_bloc.svg"
                                    alt="Chevron"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.emails ? "rotate-180" : ""} group-hover:hidden`}
                                />
                                <Image
                                    src="/icons/chevron_bloc_hover.svg"
                                    alt="Chevron Hover"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.emails ? "rotate-180" : ""} hidden group-hover:block`}
                                />
                            </div>
                        </div>

                        {!collapsedSections.emails && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                                <div>
                                    <AdminTextField
                                        label="Email de contact"
                                        value={contactEmail}
                                        onChange={setContactEmail}
                                        placeholder="Email de contact"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: RACCOURCIS */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => toggleSection("raccourcis")}
                            className="flex justify-between items-center cursor-pointer group mb-[10px]"
                        >
                            <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                                Raccourcis
                            </h3>
                            <div className="relative w-[18px] h-[18px]">
                                <Image
                                    src="/icons/chevron_bloc.svg"
                                    alt="Chevron"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.raccourcis ? "rotate-180" : ""} group-hover:hidden`}
                                />
                                <Image
                                    src="/icons/chevron_bloc_hover.svg"
                                    alt="Chevron Hover"
                                    fill
                                    className={`object-contain transition-transform duration-200 ${!collapsedSections.raccourcis ? "rotate-180" : ""} hidden group-hover:block`}
                                />
                            </div>
                        </div>

                        {!collapsedSections.raccourcis && (
                            <div className="mt-[10px]">
                                <div className="w-full border border-dashed border-[#D7D4DC] rounded-[20px] p-4 flex flex-wrap items-center pl-6 py-6 gap-4">
                                    <CTAButton
                                        onClick={async () => {
                                            setIsCleaning(true);
                                            setCleanupFeedback(null);
                                            try {
                                                const result = await cleanupOrphanedImages();
                                                console.log(result.message);
                                                if (result.details && result.details.length > 0) {
                                                    console.log("Deleted files:", result.details);
                                                }
                                                setCleanupFeedback({
                                                    type: result.success ? 'success' : 'error',
                                                    message: result.message,
                                                });
                                            } catch (e: unknown) {
                                                console.error("Erreur lors du nettoyage:", e);
                                                const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
                                                setCleanupFeedback({
                                                    type: 'error',
                                                    message: "Erreur lors du nettoyage: " + errorMessage,
                                                });
                                            } finally {
                                                setIsCleaning(false);
                                            }
                                        }}
                                        loading={isCleaning}
                                        className="bg-black hover:bg-black text-white px-6 py-3 rounded-full font-semibold flex items-center gap-3"
                                    >
                                        <Image
                                            src="/icons/supabase.svg"
                                            alt="Supabase"
                                            width={20}
                                            height={20}
                                        />
                                        Vider Buckets
                                    </CTAButton>
                                    {cleanupFeedback && (
                                        <span className={`text-sm font-semibold ${cleanupFeedback.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                            {cleanupFeedback.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button (Centered, Outside Grid) */}
                <div className="mt-[50px] flex justify-center">
                    <CTAButton
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={!hasChanges}
                        variant={hasChanges ? "active" : "inactive"}
                    >
                        Sauvegarder
                    </CTAButton>
                </div>
            </div>
        </main>
    );
}
