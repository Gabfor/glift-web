"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";

interface LogoSettings {
    logoUrl: string;
    logoAlt: string;
    isLoading: boolean;
}

// Simple in-memory cache to prevent multiple fetches
let globalSettingsCache: { logo_url: string; logo_alt: string } | null = null;
let globalFetchPromise: Promise<{ logo_url: string; logo_alt: string }> | null = null;

export function useSiteSettings(): LogoSettings {
    const [data, setData] = useState({
        logoUrl: globalSettingsCache?.logo_url || "/logo_beta.svg",
        logoAlt: globalSettingsCache?.logo_alt || "Logo Glift",
        isLoading: !globalSettingsCache,
    });

    useEffect(() => {
        if (globalSettingsCache) {
            setData({
                logoUrl: globalSettingsCache.logo_url || "/logo_beta.svg",
                logoAlt: globalSettingsCache.logo_alt || "Logo Glift",
                isLoading: false,
            });
            return;
        }

        const fetchSettings = async () => {
            try {
                if (!globalFetchPromise) {
                    const supabase = createClient();
                    const service = new SettingsService(supabase);
                    globalFetchPromise = service.getSettings().then(settings => ({
                        logo_url: settings["logo_url"] || "",
                        logo_alt: settings["logo_alt"] || ""
                    }));
                }

                const result = await globalFetchPromise;
                globalSettingsCache = result;

                setData({
                    logoUrl: result.logo_url || "/logo_beta.svg",
                    logoAlt: result.logo_alt || "Logo Glift",
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
