"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export function useLegalPages() {
  const [publishedUrls, setPublishedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
          .from("legal_pages")
          .select("url")
          .eq("is_published", true);

        if (!error && data) {
          setPublishedUrls(data.map((p: any) => p.url));
        }
      } catch (error) {
        console.error("Failed to fetch legal pages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrls();
  }, []);

  return { publishedUrls, isLoading };
}
