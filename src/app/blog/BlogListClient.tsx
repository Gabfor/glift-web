"use client";

import { useState } from "react";
import BlogArticleCard from "@/components/blog/BlogArticleCard";

type Article = {
  id: string;
  url: string;
  titre: string;
  description: string;
  image_url: string;
  image_alt?: string;
  type: string;
  categorie: string;
};

type Props = {
  initialArticles: Article[];
};

export default function BlogListClient({ initialArticles }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  // Dynamically generate categories from existing articles
  const dynamicCategories = ["Tous", ...Array.from(new Set(initialArticles.map(a => a.categorie))).sort()];

  const filteredArticles = initialArticles.filter((article) => {
    return selectedCategory === "Tous" || article.categorie === selectedCategory;
  });

  return (
    <div className="max-w-[1152px] mx-auto px-4">
      {/* Filtres par catégorie */}
      <div className="flex flex-wrap justify-center gap-2 my-[30px]">
        {dynamicCategories.length > 1 && dynamicCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-[30px] h-[44px] rounded-full text-[16px] font-semibold transition-all duration-200 border ${
              selectedCategory === cat
                ? "bg-[#3A416F] text-white border-[#3A416F]"
                : "bg-[#FBFCFE] text-[#3A416F] border-[#3A416F] hover:bg-[#3A416F] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px]">
          {filteredArticles.map((article) => (
            <BlogArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-[#5D6494] text-[18px] font-semibold">
            Aucun article ne correspond dans cette catégorie.
          </p>
          <button 
            onClick={() => setSelectedCategory("Tous")}
            className="mt-4 text-[#7069FA] font-bold hover:underline"
          >
            Voir tous les articles
          </button>
        </div>
      )}
    </div>
  );
}
