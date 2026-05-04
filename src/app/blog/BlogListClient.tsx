"use client";

import { useState, useEffect } from "react";
import BlogArticleCard from "@/components/blog/BlogArticleCard";
import Pagination from "@/components/pagination/Pagination";
import Link from "next/link";

type Article = {
  id: string;
  url: string;
  titre: string;
  description: string;
  image_url: string;
  image_alt?: string;
  type: string;
  categorie: string;
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

export default function BlogListClient({ initialArticles, initialCategory = "Tous" }: Props) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Sync state if initialCategory changes (e.g. navigation between category pages)
  useEffect(() => {
    setSelectedCategory(initialCategory);
    setCurrentPage(1);
  }, [initialCategory]);

  // Dynamically generate categories from existing articles
  const dynamicCategories = ["Tous", ...Array.from(new Set(initialArticles.map(a => a.categorie))).sort()];

  const filteredArticles = initialArticles.filter((article) => {
    return selectedCategory === "Tous" || article.categorie === selectedCategory;
  });

  const allFeatured = filteredArticles.filter(a => a.is_featured);
  const featuredArticles = allFeatured.slice(0, 4);
  const allRecent = [
    ...allFeatured.slice(4),
    ...filteredArticles.filter(a => !a.is_featured)
  ];

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecent = allRecent.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getCategoryUrl = (cat: string) => {
    if (cat === "Tous") return "/blog";
    // Standardize URL: no accents, lowercase
    const slug = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `/blog/${slug}`;
  };

  return (
    <div className="max-w-[1152px] mx-auto">
      {/* Filtres par catégorie */}
      <div className="flex flex-wrap justify-center gap-2 my-[30px]">
        {dynamicCategories.length > 1 && dynamicCategories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <Link key={cat} href={getCategoryUrl(cat)} scroll={false}>
              <button
                className={`px-[30px] h-[44px] rounded-full text-[16px] font-semibold transition-all duration-200 border ${
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

      <div className="flex flex-col gap-[30px]">
        {/* Section Articles à la une */}
        {featuredArticles.length > 0 && (
          <section>
            <h2 className="text-[14px] font-bold text-[#3A416F] uppercase mb-[20px] tracking-wider text-left">
              Articles à la une
            </h2>
            <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))] justify-center">
              {featuredArticles.map((article) => (
                <BlogArticleCard key={article.id} article={article} />
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
              <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))] justify-center">
                {paginatedRecent.map((article) => (
                  <BlogArticleCard key={article.id} article={article} />
                ))}
              </div>

              {allRecent.length > ITEMS_PER_PAGE && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={allRecent.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                  className="mt-[50px]"
                />
              )}
            </>
          ) : featuredArticles.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#5D6494] text-[18px] font-semibold">
                Aucun article ne correspond dans cette catégorie.
              </p>
              <Link href="/blog">
                <button 
                  className="mt-4 text-[#7069FA] font-bold hover:underline"
                >
                  Voir tous les articles
                </button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
