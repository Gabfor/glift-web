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
  const { data: pages, error } = await supabase.from('pages').select('id, url, titre, surtitre, description, is_published, content_blocks');
  console.log('--- PAGES ---');
  if (error) console.error(error);
  else console.log(JSON.stringify(pages?.map(p => ({ id: p.id, url: p.url, titre: p.titre, is_published: p.is_published, blocksCount: p.content_blocks?.length })), null, 2));

  const appsPage = pages?.find(p => p.url === 'apps');
  if (appsPage) {
    console.log('--- APPS PAGE DETAILS ---');
    console.log(JSON.stringify(appsPage, null, 2));
  } else {
    console.log('--- APPS PAGE NOT FOUND IN PAGES ---');
  }

  const { data: legal } = await supabase.from('legal_pages').select('id, url, titre, is_published');
  console.log('--- LEGAL PAGES ---');
  console.log(JSON.stringify(legal, null, 2));
}

check();
