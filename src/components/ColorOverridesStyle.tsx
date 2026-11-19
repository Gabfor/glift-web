import { createClient } from "@/lib/supabase/server";
import { buildColorOverridesCss, extractColorOverrides } from "@/constants/colorPalette";

/**
 * Injecte les couleurs éditées dans l'admin (/colors) en fin de <body>.
 * Sans surcharge → rien n'est rendu.
 */
export default async function ColorOverridesStyle() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("key, value").like("key", "color\\_%");
    const settings: Record<string, string> = {};
    data?.forEach((row) => {
      settings[row.key] = row.value;
    });
    const css = buildColorOverridesCss(extractColorOverrides(settings));
    if (!css) return null;
    return <style id="glift-color-overrides" dangerouslySetInnerHTML={{ __html: css }} />;
  } catch {
    return null;
  }
}
