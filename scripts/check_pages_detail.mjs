import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: pageTarifs } = await supabase.from('pages').select('*').eq('url', 'tarifs').single();
  console.log('--- TARIFS PAGE ---');
  console.log(JSON.stringify(pageTarifs, null, 2));

  const { data: pageFeature } = await supabase.from('pages').select('*').eq('url', 'creation-programmes').single();
  console.log('--- CREATION PROGRAMMES PAGE ---');
  console.log(JSON.stringify(pageFeature, null, 2));

  const { data: pageConcept } = await supabase.from('pages').select('*').eq('url', 'concept').single();
  console.log('--- CONCEPT PAGE ---');
  console.log(JSON.stringify(pageConcept, null, 2));
}

check();
