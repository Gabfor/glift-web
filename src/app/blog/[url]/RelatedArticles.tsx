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
    <div className="mt-[50px]">
      <div className="w-full h-[1px] bg-[#E7E8EA] mb-[40px]" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-[20px] gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[14px] font-bold text-[#3A416F] uppercase tracking-wider">
            Articles liés
          </h2>
          <p className="text-[#5D6494] text-[14px] font-semibold">
            Voici d’autres articles qui pourraient vous plaire.
          </p>
        </div>
        <Link
          href="/blog"
          className="h-[44px] px-[30px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition cursor-pointer"
        >
          Voir tous les articles
          <div className="relative w-[25px] h-[25px]">
            <Image
              src="/icons/arrow_blue.svg"
              alt="Flèche normale"
              fill
              className="object-contain transition-opacity group-hover:opacity-0"
              priority={false}
            />
            <Image
              src="/icons/arrow.svg"
              alt="Flèche blanche"
              fill
              className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
              priority={false}
            />
          </div>
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
