import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
  const { data, error } = await supabase.from('pages').select('*').eq('id', 'eb40db10-0d10-47af-b102-62e2763bef86').single();
  if (error) {
    console.error('Error fetching page:', error);
  } else {
    console.log('Aide page row:', JSON.stringify(data, null, 2));
  }
}
list();
