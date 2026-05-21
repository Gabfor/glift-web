import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertContactPage() {
  const contactPage = {
    id: "c131a31e-4c74-4b53-bdf5-d41a87e5b61b",
    url: "contact",
    titre: "Contactez-nous",
    surtitre: "",
    description: "Vous souhaitez nous contacter ? Remplissez le formulaire ci-dessous et nous reviendrons vers vous rapidement.",
    is_published: true,
    langue: "Français",
    content_blocks: []
  };

  const { data, error } = await supabase.from('pages').insert([contactPage]).select();
  if (error) {
    console.error('Error inserting Contact page:', error);
  } else {
    console.log('Successfully inserted Contact page:', JSON.stringify(data, null, 2));
  }
}
insertContactPage();
