"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";

interface LogoSettings {
    logoUrl: string;
    logoAlt: string;
    isLoading: boolean;
}

export function useSiteSettings(): LogoSettings {
    const [data, setData] = useState({
        logoUrl: "/logo_beta.svg",
        logoAlt: "Logo Glift",
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
