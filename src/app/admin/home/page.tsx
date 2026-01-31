"use client";

import { useCallback, useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import Image from "next/image";
import type { Database } from "@/lib/supabase/types";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import ImageUploader from "@/app/admin/components/ImageUploader";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import CTAButton from "@/components/CTAButton";

type Partner = Database["public"]["Tables"]["partners"]["Row"];

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

export default function AdminHomePage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [initialPartners, setInitialPartners] = useState<Partner[]>([]);
    const [partnersEnabled, setPartnersEnabled] = useState(true);
    const [initialPartnersEnabled, setInitialPartnersEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClientComponentClient();

    const fetchData = useCallback(async () => {
        setLoading(true);

        // Fetch partners
        const { data: partnersData, error: partnersError } = await supabase
            .from("partners")
            .select("*")
            .order("position", { ascending: true });

        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "partners_enabled")
            .single();

        if (partnersError) console.error("Error fetching partners:", partnersError);
        if (settingsError && settingsError.code !== 'PGRST116') console.error("Error fetching settings:", settingsError);

        // Set Partners
        const fetchedPartners = partnersData || [];
        setPartners(fetchedPartners);
        setInitialPartners(JSON.parse(JSON.stringify(fetchedPartners)));

        // Set Settings
        const enabled = settingsData?.value === true;
        // Note: checking strictly === true to handle jsonb nuances, assuming simple boolean stored
        // If stored as string "true", logic might need adjustment. Standard supabase jsonb boolean is usually just true/false.
        // Let's assume default true if not found is safer for UX, or match migration default.
        // Migration default was 'true'::jsonb.
        if (settingsData) {
            setPartnersEnabled(!!settingsData.value);
            setInitialPartnersEnabled(!!settingsData.value);
        } else {
            // Default if missing
            setPartnersEnabled(true);
            setInitialPartnersEnabled(true);
        }

        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdatePartner = (position: number, key: "logo_url" | "alt_text" | "link_url", value: string) => {
        setPartners((prev) => {
            const existing = prev.find((p) => p.position === position);
            if (existing) {
                return prev.map((p) => p.position === position ? { ...p, [key]: value } : p);
            } else {
                // Create new partner entry in state
                return [...prev, {
                    id: `temp_${position}`, // Temp ID for new entries
                    position,
                    [key]: value,
                    name: `Partenaire ${position}`, // Default name
                    created_at: new Date().toISOString(),
                    alt_text: key === "alt_text" ? value : "",
                    logo_url: key === "logo_url" ? value : "",
                    link_url: key === "link_url" ? value : ""
                } as Partner];
            }
        });
    };

    // Determine if there are changes
    const hasChanges = (JSON.stringify(partners) !== JSON.stringify(initialPartners)) || (partnersEnabled !== initialPartnersEnabled);

    const handleSave = async () => {
        setSaving(true);

        // 1. Save Partners
        const updates = partners.map(async (p) => {
            // Check if it's a new or existing partner
            const isTemp = p.id.startsWith("temp_");

            // Prepare payload (exclude id if temp, or created_at etc if not needed)
            const payload = {
                name: p.name,
                logo_url: p.logo_url,
                alt_text: p.alt_text,
                link_url: p.link_url,
                position: p.position
            };

            if (isTemp) {
                // Insert
                return supabase.from("partners").insert(payload);
            } else {
                // Update
                return supabase.from("partners").update(payload).eq("id", p.id);
            }
        });

        // 2. Save Settings
        const settingsUpdate = supabase
            .from("site_settings")
            .upsert({ key: "partners_enabled", value: partnersEnabled });

        await Promise.all([...updates, settingsUpdate]);

        setSaving(false);
        // Refresh to get real IDs for new items and reset change tracking
        fetchData();
    };

    const renderSlot = (position: number) => {
        const partner = partners.find((p) => p.position === position);

        return (
            <div className="flex flex-col gap-[30px]">
                {/* Image Section */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-baseline mb-[5px]">
                        <span className="text-[16px] text-[#3A416F] font-bold">Partenaire {position}</span>
                        <span className="text-[#C2BFC6] text-xs font-semibold">444px x 204px</span>
                    </div>

                    <ImageUploader
                        value={partner?.logo_url || ""}
                        onChange={(url) => handleUpdatePartner(position, "logo_url", url)}
                        placeholder="Importer un fichier"
                        bucket="partners"
                        basePath=""
                    />
                </div>

                {/* Alt Text Input */}
                <AdminTextField
                    label={`Alt image partenaire ${position}`}
                    value={partner?.alt_text || ""}
                    onChange={(val) => handleUpdatePartner(position, "alt_text", val)}
                    placeholder={`Alt partenaire ${position}`}
                />

                {/* Link Input */}
                <AdminTextField
                    label={`Lien partenaire ${position}`}
                    value={partner?.link_url || ""}
                    onChange={(val) => handleUpdatePartner(position, "link_url", val)}
                    placeholder={`Lien partenaire ${position}`}
                />
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[40px] flex justify-center">
            <div className="w-full max-w-3xl">
                <h2 className="text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
                    Accueil
                </h2>

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-[20px]">
                        {/*  Using the same style label (uppercase small) if desired, or standard header */}
                        <span className="text-[#B1BACC] font-bold text-sm tracking-wider uppercase">BLOC PARTENAIRE</span>
                        <ToggleSwitch
                            checked={partnersEnabled}
                            onCheckedChange={setPartnersEnabled}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                        {renderSlot(1)}
                        {renderSlot(2)}
                        {renderSlot(3)}
                        {renderSlot(4)}
                    </div>

                    <div className="mt-[50px] flex justify-center">
                        <CTAButton
                            onClick={handleSave}
                            loading={saving}
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
