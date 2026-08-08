import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAppsPage() {
  const newDescription = "<p>Retrouve tes programmes sur l’application Glift<br>et profite d'un suivi fluide et intuitif pour performer à chaque séance.</p>";

  const { data, error } = await supabase
    .from('pages')
    .update({ description: newDescription })
    .eq('url', 'apps')
    .select();

  if (error) {
    console.error('Error updating apps page:', error);
  } else {
    console.log('Successfully updated apps page:', JSON.stringify(data, null, 2));
  }
}

updateAppsPage();
