import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
  const { data, error } = await supabase.from('pages').select('id, titre, url');
  if (error) {
    console.error('Error fetching pages:', error);
  } else {
    console.log('Pages:', JSON.stringify(data, null, 2));
  }
}
list();
