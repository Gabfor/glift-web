"use client";

import { useState } from "react";
import BlogArticleCard from "@/components/blog/BlogArticleCard";
import SearchBar from "@/components/SearchBar";

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

const CATEGORIES = ["Tous", "Nutrition", "Entraînement", "Santé", "Motivation", "Lifestyle"];

export default function BlogListClient({ initialArticles }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArticles = initialArticles.filter((article) => {
    const matchesCategory = selectedCategory === "Tous" || article.categorie === selectedCategory;
    const matchesSearch = article.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1152px] mx-auto px-4">
      {/* Filtres par catégorie */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-[20px] py-[8px] rounded-full text-[14px] font-bold transition-all duration-200 border ${
              selectedCategory === cat
                ? "bg-[#7069FA] text-white border-[#7069FA] shadow-md"
                : "bg-white text-[#5D6494] border-[#D7D4DC] hover:border-[#C2BFC6] hover:bg-[#F4F5FE]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex justify-center mb-12">
        <div className="w-full max-w-[400px]">
          <SearchBar
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
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
            Aucun article ne correspond à votre recherche.
          </p>
          <button 
            onClick={() => { setSelectedCategory("Tous"); setSearchTerm(""); }}
            className="mt-4 text-[#7069FA] font-bold hover:underline"
          >
            Voir tous les articles
          </button>
        </div>
      )}
    </div>
  );
}
