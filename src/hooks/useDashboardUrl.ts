"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export function useDashboardUrl() {
  const [dashboardUrl, setDashboardUrl] = useState("/dashboard");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
          .from("pages")
          .select("url")
          .eq("id", "59822297-b8b2-4041-bfa6-03793221fcf6")
          .single();

        if (!error && data?.url) {
          setDashboardUrl(`/${data.url}`);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard URL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrl();
  }, []);

  return { dashboardUrl, isLoading };
}
