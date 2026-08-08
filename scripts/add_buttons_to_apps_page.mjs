import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAppsContent() {
  const content_blocks = [
    {
      id: "apps-download-buttons",
      type: "boutons",
      enabled: true,
      bouton1: {
        type: "google",
        texte: "Télécharger sur Android",
        lien: ""
      },
      bouton2: {
        type: "apple",
        texte: "Télécharger sur IOS",
        lien: ""
      }
    }
  ];

  const { data, error } = await supabase
    .from('pages')
    .update({ content_blocks })
    .eq('url', 'apps')
    .select();

  if (error) {
    console.error('Error updating apps page blocks:', error);
  } else {
    console.log('Successfully updated apps page blocks:', JSON.stringify(data, null, 2));
  }
}

updateAppsContent();
