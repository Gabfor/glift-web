import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export type SettingsMap = Record<string, string>;

export class SettingsService {
    constructor(private supabase: SupabaseClient<Database>) { }

    async getSettings(): Promise<SettingsMap> {
        const { data, error } = await this.supabase
            .from("settings")
            .select("key, value");

        if (error) {
            console.error("Error fetching settings:", error);
            return {};
        }

        const settings: SettingsMap = {};
        data?.forEach((item) => {
            settings[item.key] = item.value;
        });

        return settings;
    }

    async getSetting(key: string): Promise<string | null> {
        const { data, error } = await this.supabase
            .from("settings")
            .select("value")
            .eq("key", key)
            .single();

        if (error) {
            if (error.code !== "PGRST116") { // Ignore "Row not found" errors
                console.error(`Error fetching setting '${key}':`, error);
            }
            return null;
        }

        return data?.value || null;
    }

    async updateSetting(key: string, value: string) {
        const { error } = await this.supabase
            .from("settings")
            .upsert({ key, value, updated_at: new Date().toISOString() });

        if (error) {
            throw new Error(`Failed to update setting '${key}': ${error.message}`);
        }
    }

    async uploadLogo(file: File): Promise<string> {
        const fileExt = file.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await this.supabase.storage
            .from("logos")
            .upload(filePath, file);

        if (uploadError) {
            throw new Error(`Failed to upload logo: ${uploadError.message}`);
        }

        const { data } = this.supabase.storage.from("logos").getPublicUrl(filePath);
        return data.publicUrl;
    }
}
