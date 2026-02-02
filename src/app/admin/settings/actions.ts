"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export type CleanupResult = {
    success: boolean;
    message: string;
    deletedCount: number;
    details?: string[];
};

export async function cleanupOrphanedImages(): Promise<CleanupResult> {
    const supabase = await createClient(); // Regular client for DB
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
        const { data: settings } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "logo_url")
            .single();

        if (settings?.value) usedUrls.add(settings.value);

        // E. Sliders
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

        // F. Avatars (Requires Admin Client)
        try {
            const adminClient = createAdminClient();
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const { data: { users }, error } = await adminClient.auth.admin.listUsers({
                    page: page,
                    perPage: 1000
                });

                if (error) throw error;

                if (!users || users.length === 0) {
                    hasMore = false;
                } else {
                    users.forEach(u => {
                        const meta = u.user_metadata;
                        if (meta?.avatar_url) usedUrls.add(meta.avatar_url);
                        // We could also check meta.avatar_path directly, but strict URL matching is safest for now
                    });
                    page++;
                }
            }
        } catch (adminError) {
            console.warn("Skipping avatars cleanup (Admin privileges missing/error):", adminError);
        }

        // Helper to extract path from URL
        const extractPath = (url: string, bucketName: string): string | null => {
            if (!url.includes(`/${bucketName}/`)) return null;
            const parts = url.split(`/${bucketName}/`);
            if (parts.length < 2) return null;
            return decodeURIComponent(parts[1]);
        };

        // 2. Scan Buckets and Cleanup
        const cleanBucket = async (bucketName: string, folder: string = "") => {
            // Note: Recurse into subfolders if necessary?
            // "avatars" uses folder structure: {userId}/{filename}
            // "program-images" uses "programmes/" and maybe root.

            // For avatars, we need to list recursively if possible.
            // But supabase storage list is flat per folder.
            // If we list root of "avatars", we get folder names (user IDs) or files.
            // We need a proper recursive strategy or assume structure.
            // For now, let's keep it simple:
            // "program-images" -> "programmes/" and root.
            // "avatars" -> root gives folders. listing folders gives files. This is expensive recursively.
            // Wait, "avatars" structure is `userId/filename`.
            // Standard user buckets are hard to clean without recursive listing.
            // If I just list root of avatars, I get folders.
            // Does list() return folders as objects? Yes.

            // Recursive Lister for specific deep buckets like avatars
            if (bucketName === "avatars") {
                const { data: rootItems } = await supabase.storage.from(bucketName).list();
                if (rootItems) {
                    for (const item of rootItems) {
                        if (!item.id) { // It's a folder (Supabase convention usually, or check mimetype?)
                            // Actually list() returns files AND folders. Folders have `id: null` in some versions or we check distinctness.
                            // Safest is to try listing content of 'item.name'
                            const { data: subFiles } = await supabase.storage.from(bucketName).list(item.name);
                            if (subFiles && subFiles.length > 0) {
                                const subToDelete: string[] = [];
                                for (const sub of subFiles) {
                                    if (sub.name === ".emptyFolderPlaceholder") continue;
                                    const fullPath = `${item.name}/${sub.name}`;

                                    // Check usage
                                    const isUsed = Array.from(usedUrls).some(url => {
                                        const pathInUrl = extractPath(url, bucketName);
                                        return pathInUrl === fullPath;
                                    });

                                    if (!isUsed) subToDelete.push(fullPath);
                                }

                                if (subToDelete.length > 0) {
                                    await supabase.storage.from(bucketName).remove(subToDelete);
                                    totalDeleted += subToDelete.length;
                                    deletedFiles.push(...subToDelete.map(f => `${bucketName}/${f}`));
                                }
                            }
                        }
                    }
                }
                return;
            }

            // Normal flat buckets
            const { data: files, error } = await supabase.storage.from(bucketName).list(folder, { limit: 1000 });
            if (error) {
                console.error(`Error listing bucket ${bucketName}/${folder}:`, error);
                return;
            }

            const toDelete: string[] = [];

            for (const file of files) {
                if (file.name === ".emptyFolderPlaceholder") continue;

                const filePath = folder ? `${folder}/${file.name}` : file.name;

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
        await cleanBucket("partners", "");
        // await cleanBucket("logos", ""); // Disabled for safety

        try {
            await cleanBucket("avatars", ""); // Will trigger recursive logic
        } catch (e) {
            console.error("Error cleaning avatars:", e);
        }

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
