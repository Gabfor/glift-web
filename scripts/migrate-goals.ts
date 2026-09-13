import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variables d'environnement Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const GOAL_MAPPING: Record<string, string> = {
  "Perte de poids": "Perte de graisse",
  "Gain de force": "Force & Performance",
  "Performance sportive": "Force & Performance",
  "Performance": "Force & Performance",
  "Remise en forme": "Remise en forme & Santé",
  "Confiance & bien-être": "Remise en forme & Santé",
  "Prévention des blessures": "Remise en forme & Santé",
  "Santé & longévité": "Remise en forme & Santé",
  "Routine & discipline": "Remise en forme & Santé",
  "Routine & Discipline": "Remise en forme & Santé",
};

async function migrateGoals() {
  console.log("🚀 Début de la migration des objectifs...\n");

  // 1. Table profiles
  for (const [oldVal, newVal] of Object.entries(GOAL_MAPPING)) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ main_goal: newVal })
      .eq("main_goal", oldVal)
      .select("id");

    if (error) {
      console.error(`Erreur sur profiles pour "${oldVal}":`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ profiles: ${data.length} profil(s) mis à jour de "${oldVal}" vers "${newVal}"`);
    }
  }

  // 2. Table program_store
  for (const [oldVal, newVal] of Object.entries(GOAL_MAPPING)) {
    const { data, error } = await supabase
      .from("program_store")
      .update({ goal: newVal })
      .eq("goal", oldVal)
      .select("id");

    if (error) {
      console.error(`Erreur sur program_store pour "${oldVal}":`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ program_store: ${data.length} programme(s) mis à jour de "${oldVal}" vers "${newVal}"`);
    }
  }

  // 3. Table blog_articles
  for (const [oldVal, newVal] of Object.entries(GOAL_MAPPING)) {
    const { data, error } = await supabase
      .from("blog_articles")
      .update({ objectif: newVal })
      .eq("objectif", oldVal)
      .select("id");

    if (error) {
      console.error(`Erreur sur blog_articles pour "${oldVal}":`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ blog_articles: ${data.length} article(s) mis à jour de "${oldVal}" vers "${newVal}"`);
    }
  }

  console.log("\n🎉 Migration terminée avec succès !");
}

migrateGoals().catch(console.error);
