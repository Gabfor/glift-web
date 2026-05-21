"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export function useDashboardUrl() {
  const [dashboardUrl, setDashboardUrl] = useState("/dashboard");
  const [shopUrl, setShopUrl] = useState("/shop");
  const [storeUrl, setStoreUrl] = useState("/store");
  const [trainingsUrl, setTrainingsUrl] = useState("/entrainements");
  const [blogUrl, setBlogUrl] = useState("/blog");
  const [helpUrl, setHelpUrl] = useState("/aide");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
          .from("pages")
          .select("id, url")
          .in("id", [
            "59822297-b8b2-4041-bfa6-03793221fcf6", // Dashboard
            "eb4e258a-0876-421e-b653-176c8c08ed3d", // Glift Shop
            "fd7e055c-bf17-4222-a8f8-c27b014d3062", // Glift Store
            "90c6b3f6-1b46-4711-8882-28177874b51d", // Trainings
            "f9709b0b-b513-4d53-a6ef-d9cda3f0a706", // Blog
            "eb40db10-0d10-47af-b102-62e2763bef86"  // Help / Aide
          ]);

        if (!error && data) {
          data.forEach((page: any) => {
            if (page.id === "59822297-b8b2-4041-bfa6-03793221fcf6" && page.url) {
              setDashboardUrl(`/${page.url}`);
            } else if (page.id === "eb4e258a-0876-421e-b653-176c8c08ed3d" && page.url) {
              setShopUrl(`/${page.url}`);
            } else if (page.id === "fd7e055c-bf17-4222-a8f8-c27b014d3062" && page.url) {
              setStoreUrl(`/${page.url}`);
            } else if (page.id === "90c6b3f6-1b46-4711-8882-28177874b51d" && page.url) {
              setTrainingsUrl(`/${page.url}`);
            } else if (page.id === "f9709b0b-b513-4d53-a6ef-d9cda3f0a706" && page.url) {
              setBlogUrl(`/${page.url}`);
            } else if (page.id === "eb40db10-0d10-47af-b102-62e2763bef86" && page.url) {
              setHelpUrl(`/${page.url}`);
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch page URLs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrls();
  }, []);

  return { dashboardUrl, shopUrl, storeUrl, trainingsUrl, blogUrl, helpUrl, isLoading };
}
