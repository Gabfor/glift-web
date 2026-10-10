"use client";

import { useState, useEffect } from "react";
import BlogArticleCard from "@/components/blog/BlogArticleCard";
import LoadMore from "@/components/pagination/LoadMore";
import Link from "next/link";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";

type Article = {
  id: string;
  url: string;
  titre: string;
  description: string;
  image_url: string;
  image_mobile?: string;
  image_alt?: string;
  type: string;
  categorie: string | string[];
  sexe: string;
  is_featured?: boolean;
  niveau?: string;
  nombre_seances?: string;
  duree_moyenne?: string;
};

type Props = {
  initialArticles: Article[];
  initialCategory?: string;
};

const ITEMS_PER_BATCH = 12;

function getArticleCategories(cat: unknown): string[] {
  if (Array.isArray(cat)) {
    return cat.filter((c): c is string => typeof c === "string" && c.trim() !== "");
  }
  if (typeof cat === "string") {
    try {
      const parsed = JSON.parse(cat);
      if (Array.isArray(parsed)) {
        return parsed.filter((c): c is string => typeof c === "string" && c.trim() !== "");
      }
    } catch {}
    return cat.trim() ? [cat.trim()] : [];
  }
  return [];
}

export default function BlogListClient({ initialArticles, initialCategory = "Tous" }: Props) {
  const { blogUrl } = useDashboardUrl();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);

  // Sync state if initialCategory changes (e.g. navigation between category pages)
  useEffect(() => {
    setSelectedCategory(initialCategory);
    setVisibleCount(ITEMS_PER_BATCH);
  }, [initialCategory]);

  // Dynamically generate categories from existing articles (filter out null/undefined/empty)
  const validArticleCategories = Array.from(
    new Set(
      initialArticles.flatMap((a) => getArticleCategories(a.categorie))
    )
  ).sort();
  const dynamicCategories = ["Tous", ...validArticleCategories];

  const filteredArticles = initialArticles.filter((article) => {
    if (selectedCategory === "Tous") return true;
    const cats = getArticleCategories(article.categorie);
    return cats.includes(selectedCategory);
  });

  const isCategoryPage = selectedCategory !== "Tous";

  // Category page: unified list with featured articles placed first
  const sortedCategoryArticles = [...filteredArticles].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  // Main blog page: split into Featured & Recent
  const allFeatured = filteredArticles.filter((a) => a.is_featured);
  const featuredArticles = allFeatured.slice(0, 4);
  const allRecent = [
    ...allFeatured.slice(4),
    ...filteredArticles.filter((a) => !a.is_featured),
  ];

  const displayedCategoryArticles = sortedCategoryArticles.slice(0, visibleCount);
  const displayedRecent = allRecent.slice(0, visibleCount);

  const getCategoryUrl = (cat: string) => {
    if (!cat || cat === "Tous") return blogUrl;
    // Standardize URL: no accents, lowercase
    const slug = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `${blogUrl}/${slug}`;
  };

  return (
    <div className="max-w-[1152px] mx-auto">
      {/* Filtres par catégorie */}
      <div className="w-auto -mx-5 sm:mx-0 sm:w-full my-[30px] overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-start sm:justify-center gap-2 min-w-max px-5 sm:px-0 mx-auto">
          {dynamicCategories.length > 1 && dynamicCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <Link key={cat} href={getCategoryUrl(cat)} scroll={false} className="shrink-0">
                <button
                  className={`px-5 sm:px-[30px] h-[38px] sm:h-[44px] rounded-full text-[14px] sm:text-[16px] font-semibold transition-all duration-200 border whitespace-nowrap ${
                    isActive
                      ? "bg-[#3A416F] text-white border-[#3A416F]"
                      : "bg-[#FBFCFE] text-[#3A416F] border-[#3A416F] hover:bg-[#3A416F] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-[30px]">
        {isCategoryPage ? (
          /* Page Catégorie : Grille unifiée */
          <section>
            {sortedCategoryArticles.length > 0 ? (
              <>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
                  {displayedCategoryArticles.map((article) => (
                    <BlogArticleCard key={article.id} article={article} blogUrl={blogUrl} />
                  ))}
                </div>

                <LoadMore
                  currentCount={displayedCategoryArticles.length}
                  totalCount={sortedCategoryArticles.length}
                  onLoadMore={() => setVisibleCount((prev) => prev + ITEMS_PER_BATCH)}
                  label="articles"
                />
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-[#5D6494] text-[18px] font-semibold">
                  Aucun article ne correspond dans cette catégorie.
                </p>
                <Link href={blogUrl}>
                  <button 
                    className="mt-4 text-[#7069FA] font-bold hover:underline"
                  >
                    Voir tous les articles
                  </button>
                </Link>
              </div>
            )}
          </section>
        ) : (
          /* Page Blog principale ("Tous") : Articles à la une + Articles récents */
          <>
            {/* Section Articles à la une */}
            {featuredArticles.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-[#3A416F] uppercase mb-[20px] tracking-wider text-left">
                  Articles à la une
                </h2>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
                  {featuredArticles.map((article) => (
                    <BlogArticleCard key={article.id} article={article} blogUrl={blogUrl} />
                  ))}
                </div>
              </section>
            )}

            {/* Section Articles récents */}
            <section>
              {allRecent.length > 0 ? (
                <>
                  <h2 className="text-[14px] font-bold text-[#3A416F] uppercase mb-[20px] tracking-wider text-left">
                    Articles récents
                  </h2>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
                    {displayedRecent.map((article) => (
                      <BlogArticleCard key={article.id} article={article} blogUrl={blogUrl} />
                    ))}
                  </div>

                  <LoadMore
                    currentCount={displayedRecent.length}
                    totalCount={allRecent.length}
                    onLoadMore={() => setVisibleCount((prev) => prev + ITEMS_PER_BATCH)}
                    label="articles"
                  />
                </>
              ) : featuredArticles.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-[#5D6494] text-[18px] font-semibold">
                    Aucun article ne correspond dans cette catégorie.
                  </p>
                  <Link href={blogUrl}>
                    <button 
                      className="mt-4 text-[#7069FA] font-bold hover:underline"
                    >
                      Voir tous les articles
                    </button>
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
