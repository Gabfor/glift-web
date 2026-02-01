"use server";

import { createClient } from "@/lib/supabase/server";

export type CleanupResult = {
    success: boolean;
    message: string;
    deletedCount: number;
    details?: string[];
};

export async function cleanupOrphanedImages(): Promise<CleanupResult> {
    const supabase = await createClient();
    const deletedFiles: string[] = [];
    let totalDeleted = 0;

    try {
        // 1. Collect all used Image URLs from Database
        const usedUrls = new Set<string>();

        // A. Offer Shop
        const { data: offers } = await supabase
            .from("offer_shop")
            .select("image, brand_image, image_mobile, slider_image");

        offers?.forEach((o) => {
            if (o.image) usedUrls.add(o.image);
            if (o.brand_image) usedUrls.add(o.brand_image);
            if (o.image_mobile) usedUrls.add(o.image_mobile);
            if (o.slider_image) usedUrls.add(o.slider_image);
        });

        // B. Partners
        const { data: partners } = await supabase
            .from("partners")
            .select("logo_url");

        partners?.forEach((p) => {
            if (p.logo_url) usedUrls.add(p.logo_url);
        });

        // C. Program Store
        const { data: programs } = await supabase
            .from("program_store")
            .select("image, partner_image");

        programs?.forEach((p) => {
            if (p.image) usedUrls.add(p.image);
            if (p.partner_image) usedUrls.add(p.partner_image);
        });

        // D. Settings (Logo)
        // Settings table stores key-value pairs. 
        // We specifically look for 'logo_url' key based on usage in SettingsService.
        const { data: settings } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "logo_url")
            .single();

        if (settings?.value) usedUrls.add(settings.value);

        // E. Sliders (JSON parsing)
        const { data: sliders } = await supabase
            .from("sliders_admin")
            .select("slides");

        sliders?.forEach((s) => {
            if (Array.isArray(s.slides)) {
                s.slides.forEach((slide: any) => {
                    if (slide?.image) usedUrls.add(slide.image);
                });
            }
        });

        // Helper to extract path from URL
        // URL format: .../storage/v1/object/public/{bucket}/{path}
        const extractPath = (url: string, bucketName: string): string | null => {
            if (!url.includes(`/${bucketName}/`)) return null;
            const parts = url.split(`/${bucketName}/`);
            if (parts.length < 2) return null;
            return decodeURIComponent(parts[1]);
        };

        // 2. Scan Buckets and Cleanup

        // --- Bucket: program-images ---
        // Files are typically in "programmes/" folder
        // We list root (just in case) and "programmes" folder
        // Note: Supabase list is not recursive by default. We assume simple structure.
        const cleanBucket = async (bucketName: string, folder: string = "") => {
            const { data: files, error } = await supabase.storage.from(bucketName).list(folder, { limit: 1000 });
            if (error) {
                console.error(`Error listing bucket ${bucketName}/${folder}:`, error);
                return;
            }

            const toDelete: string[] = [];

            for (const file of files) {
                if (file.name === ".emptyFolderPlaceholder") continue; // Skip placeholders

                // Construct full path
                const filePath = folder ? `${folder}/${file.name}` : file.name;

                // We match against usedUrls
                // We check if ANY used URL ends with this filePath
                const isUsed = Array.from(usedUrls).some(url => {
                    const pathInUrl = extractPath(url, bucketName);
                    return pathInUrl === filePath;
                });

                if (!isUsed) {
                    toDelete.push(filePath);
                }
            }

            if (toDelete.length > 0) {
                const { error: deleteError } = await supabase.storage.from(bucketName).remove(toDelete);
                if (deleteError) {
                    console.error(`Error deleting from ${bucketName}:`, deleteError);
                } else {
                    totalDeleted += toDelete.length;
                    deletedFiles.push(...toDelete.map(f => `${bucketName}/${f}`));
                }
            }
        };

        await cleanBucket("program-images", "programmes");
        // Also check root of program-images just in case

        await cleanBucket("partners", ""); // Root
        await cleanBucket("logos", ""); // Root

        return {
            success: true,
            message: `Nettoyage terminé. ${totalDeleted} fichier(s) supprimé(s).`,
            deletedCount: totalDeleted,
            details: deletedFiles
        };

    } catch (err: any) {
        console.error("Cleanup error:", err);
        return {
            success: false,
            message: "Erreur lors du nettoyage: " + err.message,
            deletedCount: 0
        };
    }
}
