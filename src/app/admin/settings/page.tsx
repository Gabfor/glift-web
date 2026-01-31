"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";
import CTAButton from "@/components/CTAButton";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import ImageUploader from "@/app/admin/components/ImageUploader";

// Inline SVG for dynamic coloring (same as admin/home)
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

    // Initial state for change detection
    const [initialLogoUrl, setInitialLogoUrl] = useState<string>("");
    const [initialAltText, setInitialAltText] = useState<string>("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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
            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const hasChanges = (logoUrl !== initialLogoUrl) || (altText !== initialAltText);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (logoUrl) {
                await settingsService.updateSetting("logo_url", logoUrl);
            }
            await settingsService.updateSetting("logo_alt", altText);

            // Update initial state
            setInitialLogoUrl(logoUrl);
            setInitialAltText(altText);

            // alert("Paramètres sauvegardés !"); // Optional, relying on button state feedback usually or toast
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
                    <div className="flex justify-between items-center mb-[20px]">
                        <span className="text-[#D7D4DC] font-bold text-sm tracking-wider uppercase">LOGO</span>
                    </div>

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
                </div>
            </div>
        </main>
    );
}
