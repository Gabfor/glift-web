"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";
import CTAButton from "@/components/CTAButton";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import ImageUploader from "@/app/admin/components/ImageUploader";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { cleanupOrphanedImages } from "./actions";

// Inline SVG for dynamic coloring
function SaveIcon({ fill }: { fill: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M13.7578 0C14.5533 0.000119943 15.3164 0.316404 15.8789 0.878906L19.1211 4.12109C19.6836 4.6836 19.9999 5.4467 20 6.24219V17C20 18.6569 18.6569 20 17 20H3C1.34315 20 0 18.6569 0 17V3C0 1.34315 1.34315 0 3 0H13.7578ZM10 12C8.34315 12 7 13.3431 7 15C7 16.6569 8.34315 18 10 18C11.6569 18 13 16.6569 13 15C13 13.3431 11.6569 12 10 12ZM6 3C5.44772 3 5 3.44772 5 4V7.5C5 8.05228 5.44772 8.5 6 8.5H14C14.5523 8.5 15 8.05228 15 7.5V4C15 3.44772 14.5523 3 14 3H6Z"
                fill={fill}
            />
        </svg>
    );
}

export default function AdminSettingsPage() {
    const [logoUrl, setLogoUrl] = useState<string>("");
    const [altText, setAltText] = useState<string>("");
    const [partnersEnabled, setPartnersEnabled] = useState(true);

    // Initial state for change detection
    const [initialLogoUrl, setInitialLogoUrl] = useState<string>("");
    const [initialAltText, setInitialAltText] = useState<string>("");
    const [initialPartnersEnabled, setInitialPartnersEnabled] = useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

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

                // Fetch Partners Toggle
                const { data: siteSettings } = await supabase
                    .from("site_settings")
                    .select("value")
                    .eq("key", "partners_enabled")
                    .single();

                if (siteSettings) {
                    const enabled = siteSettings.value === true;
                    setPartnersEnabled(enabled);
                    setInitialPartnersEnabled(enabled);
                }

            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const hasChanges = (logoUrl !== initialLogoUrl) || (altText !== initialAltText) || (partnersEnabled !== initialPartnersEnabled);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (logoUrl) {
                await settingsService.updateSetting("logo_url", logoUrl);
            }
            await settingsService.updateSetting("logo_alt", altText);

            await supabase
                .from("site_settings")
                .upsert({ key: "partners_enabled", value: partnersEnabled, updated_at: new Date().toISOString() });

            // Update initial state
            setInitialLogoUrl(logoUrl);
            setInitialAltText(altText);
            setInitialPartnersEnabled(partnersEnabled);

        } catch (error) {
            console.error("Save failed", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[#FBFCFE] pt-[140px] flex justify-center">Chargement...</div>;
    }

    return (
        <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[40px] flex justify-center">
            <div className="w-full max-w-3xl">
                <h2 className="text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
                    Paramètres
                </h2>

                <div className="mb-8">
                    {/* Header with Toggle */}
                    <div className="flex justify-between items-center mb-[20px]">
                        <span className="text-[#D7D4DC] font-bold text-sm tracking-wider uppercase">BLOC PARTENAIRE</span>
                        <ToggleSwitch
                            checked={partnersEnabled}
                            onCheckedChange={setPartnersEnabled}
                        />
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                        {/* Logo Upload Section */}
                        <div className="flex flex-col gap-[10px]">
                            <div className="flex justify-between items-baseline mb-[5px]">
                                <span className="text-[16px] text-[#3A416F] font-bold">Logo</span>
                                <span className="text-[#C2BFC6] text-xs font-semibold">147px x 35px</span>
                            </div>
                            <ImageUploader
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

                    {/* Save Button (Centered, Outside Grid) */}
                    <div className="mt-[50px] flex justify-center">
                        <CTAButton
                            onClick={handleSave}
                            loading={isSaving}
                            disabled={!hasChanges}
                            variant={hasChanges ? "active" : "inactive"}
                        >
                            <SaveIcon fill={hasChanges ? "white" : "#D7D4DC"} />
                            Sauvegarder
                        </CTAButton>
                    </div>

                    {/* Cleanup Section */}
                    <div className="mt-[60px]">
                        <div className="flex justify-between items-center mb-[20px]">
                            <span className="text-[#D7D4DC] font-bold text-sm tracking-wider uppercase">VIDE BUCKETS SUPABASE</span>
                        </div>

                        {/* Dashed Container */}
                        <div className="w-full border border-dashed border-[#D7D4DC] rounded-[20px] p-4 flex items-center pl-6 py-6">
                            <CTAButton
                                onClick={async () => {
                                    setIsCleaning(true);
                                    try {
                                        const result = await cleanupOrphanedImages();
                                        console.log(result.message);
                                        if (result.details && result.details.length > 0) {
                                            console.log("Deleted files:", result.details);
                                        }
                                    } catch (e: any) {
                                        console.error("Erreur lors du nettoyage:", e);
                                    } finally {
                                        setIsCleaning(false);
                                    }
                                }}
                                loading={isCleaning}
                                className="bg-[#111111] hover:bg-black text-white px-6 py-3 rounded-full font-semibold flex items-center gap-3"
                            >
                                <Image
                                    src="/icons/supabase.svg"
                                    alt="Supabase"
                                    width={20}
                                    height={20}
                                />
                                Vider Buckets
                            </CTAButton>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
