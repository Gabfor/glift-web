"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";

interface SiteSettings {
    logoUrl: string;
    logoAlt: string;
    trialDays: number;
    isLoading: boolean;
}

export function useSiteSettings(): SiteSettings {
    const [data, setData] = useState<SiteSettings>({
        logoUrl: "/logo_beta.svg",
        logoAlt: "Logo Glift",
        trialDays: 30, // Default
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
