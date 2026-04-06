import BlogArticleCard from "@/components/blog/BlogArticleCard";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";

// Nous devons instancier le client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  articleLie1Id: string | null;
  articleLie2Id: string | null;
};

export default async function RelatedArticles({ articleLie1Id, articleLie2Id }: Props) {
  if (!articleLie1Id && !articleLie2Id) return null;

  const idsToFetch = [articleLie1Id, articleLie2Id].filter(Boolean) as string[];

  const { data: relatedArticles, error } = await supabase
    .from("blog_articles")
    .select("id, url, titre, description, image_url, image_alt, type, categorie, sexe")
    .in("id", idsToFetch)
    .eq("is_published", true)
    .limit(2);

  if (error || !relatedArticles || relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="mt-[60px] pb-[60px]">
      <div className="w-full h-[1px] bg-[#E7E8EA] mb-[40px]" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-[40px] gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-[#3A416F] uppercase tracking-wider">
            Articles liés
          </h2>
          <p className="text-[#5D6494] text-[16px]">
            Voici d’autres articles qui pourraient vous plaire.
          </p>
        </div>
        <Link href="/blog">
          <button className="flex items-center gap-2 border border-[#3A416F] text-[#3A416F] text-[14px] font-bold px-[24px] py-[10px] rounded-full transition-all bg-white hover:bg-[#F4F5FE]">
            Voir tous les articles
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[30px]">
        {relatedArticles.map((article: any) => (
          <BlogArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
