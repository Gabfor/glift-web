import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data } = await supabase.from("blog_articles").select("categorie");
  const cats = Array.from(new Set(data?.map(a => a.categorie)));
  console.log(cats);
}
run();
