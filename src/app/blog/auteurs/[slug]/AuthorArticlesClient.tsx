"use client";

import React, { useState } from "react";
import BlogArticleCard from "@/components/blog/BlogArticleCard";
import LoadMore from "@/components/pagination/LoadMore";

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
  created_at: string;
  auteur?: string;
};

type Props = {
  articles: Article[];
  authorName: string;
};

const ITEMS_PER_BATCH = 12;

export default function AuthorArticlesClient({ articles, authorName }: Props) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#5D6494] text-[16px] font-semibold">
          Aucun article n'a été rédigé par {authorName} pour le moment.
        </p>
      </div>
    );
  }

  const displayedArticles = articles.slice(0, visibleCount);

  return (
    <>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center mt-6">
        {displayedArticles.map((article) => (
          <BlogArticleCard
            key={article.id}
            article={article}
            blogUrl="/blog"
          />
        ))}
      </div>

      <LoadMore
        currentCount={displayedArticles.length}
        totalCount={articles.length}
        onLoadMore={() => setVisibleCount((prev) => prev + ITEMS_PER_BATCH)}
        label="articles"
      />
    </>
  );
}
