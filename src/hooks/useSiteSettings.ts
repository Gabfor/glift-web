"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";

interface SiteSettings {
    logoUrl: string;
    logoAlt: string;
    trialDays: number;
    starterMaxTrainings: number;
    starterMaxExercises: number;
    isPremiumPaymentStepEnabled: boolean;
    premiumMonthlyEnabled: boolean;
    premiumYearlyEnabled: boolean;
    premiumMonthlyPrice: string;
    premiumYearlyPrice: string;
    premiumMonthlyStripeId: string;
    premiumYearlyStripeId: string;
    gradientEnabled: boolean;
    gradientColor1: string;
    gradientOpacity1: number;
    gradientColor2: string;
    gradientOpacity2: number;
    gradientColor3: string;
    gradientOpacity3: number;
    isLoading: boolean;
}

export function useSiteSettings(): SiteSettings {
    const [data, setData] = useState<SiteSettings>({
        logoUrl: "/logo_beta.svg",
        logoAlt: "Logo Glift",
        trialDays: 30, // Default
        starterMaxTrainings: 1,
        starterMaxExercises: 10,
        isPremiumPaymentStepEnabled: false, // Default to disabled to be safe
        premiumMonthlyEnabled: true,
        premiumYearlyEnabled: false,
        premiumMonthlyPrice: "2,49",
        premiumYearlyPrice: "24,99",
        premiumMonthlyStripeId: "",
        premiumYearlyStripeId: "",
        gradientEnabled: true,
        gradientColor1: "#F6E9F9",
        gradientOpacity1: 65,
        gradientColor2: "#E4ECFF",
        gradientOpacity2: 65,
        gradientColor3: "#F0EBFF",
        gradientOpacity3: 80,
        isLoading: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const supabase = createClient();
                const service = new SettingsService(supabase);
                const settings = await service.getSettings();

                setData({
                    logoUrl: settings["logo_url"] || "/logo_beta.svg",
                    logoAlt: settings["logo_alt"] || "Logo Glift",
                    trialDays: settings["trial_period_days"] ? parseInt(settings["trial_period_days"], 10) : 30,
                    starterMaxTrainings: settings["starter_max_trainings"] ? parseInt(settings["starter_max_trainings"], 10) : 1,
                    starterMaxExercises: settings["starter_max_exercises"] ? parseInt(settings["starter_max_exercises"], 10) : 10,
                    isPremiumPaymentStepEnabled: settings["premium_payment_step"] === "enabled",
                    premiumMonthlyEnabled: settings["premium_monthly_enabled"] !== "NON",
                    premiumYearlyEnabled: settings["premium_yearly_enabled"] === "OUI",
                    premiumMonthlyPrice: settings["premium_monthly_price"] || "2,49",
                    premiumYearlyPrice: settings["premium_yearly_price"] || "24,99",
                    premiumMonthlyStripeId: settings["premium_monthly_stripe_id"] || "",
                    premiumYearlyStripeId: settings["premium_yearly_stripe_id"] || "",
                    gradientEnabled: settings["gradient_enabled"] !== "false",
                    gradientColor1: settings["gradient_color1"] || "#F6E9F9",
                    gradientOpacity1: settings["gradient_opacity1"] ? parseInt(settings["gradient_opacity1"], 10) : 65,
                    gradientColor2: settings["gradient_color2"] || "#E4ECFF",
                    gradientOpacity2: settings["gradient_opacity2"] ? parseInt(settings["gradient_opacity2"], 10) : 65,
                    gradientColor3: settings["gradient_color3"] || "#F0EBFF",
                    gradientOpacity3: settings["gradient_opacity3"] ? parseInt(settings["gradient_opacity3"], 10) : 80,
                    isLoading: false,
                });
            } catch (error) {
                console.error("Failed to fetch site settings:", error);
                setData((prev) => ({ ...prev, isLoading: false }));
            }
        };

        fetchSettings();
    }, []);

    return data;
}
