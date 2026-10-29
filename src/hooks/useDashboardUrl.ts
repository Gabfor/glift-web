"use client";
 
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
 
export function useDashboardUrl() {
  const [dashboardUrl, setDashboardUrl] = useState("/tableau-de-bord");
  const [shopUrl, setShopUrl] = useState("/shop");
  const [storeUrl, setStoreUrl] = useState("/store");
  const [trainingsUrl, setTrainingsUrl] = useState("/entrainements");
  const [blogUrl, setBlogUrl] = useState("/blog");
  const [helpUrl, setHelpUrl] = useState("/aide");
  const [contactUrl, setContactUrl] = useState("/nous-contacter");
  const [compteUrl, setCompteUrl] = useState("/compte");
 
  const [isDashboardPublished, setIsDashboardPublished] = useState(true);
  const [isShopPublished, setIsShopPublished] = useState(true);
  const [isStorePublished, setIsStorePublished] = useState(true);
  const [isTrainingsPublished, setIsTrainingsPublished] = useState(true);
  const [isBlogPublished, setIsBlogPublished] = useState(true);
  const [isHelpPublished, setIsHelpPublished] = useState(true);
  const [isContactPublished, setIsContactPublished] = useState(true);
  const [isComptePublished, setIsComptePublished] = useState(true);
  const [isTarifsPublished, setIsTarifsPublished] = useState(true);
  const [isAppsPublished, setIsAppsPublished] = useState(true);
  const [isPressKitPublished, setIsPressKitPublished] = useState(true);
 
  const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
          .from("pages")
          .select("id, url, is_published");
 
        if (!error && data) {
          data.forEach((page: any) => {
            const published = page.is_published !== false;
            if (page.id === "59822297-b8b2-4041-bfa6-03793221fcf6") {
              if (page.url) setDashboardUrl(`/${page.url}`);
              setIsDashboardPublished(published);
            } else if (page.id === "eb4e258a-0876-421e-b653-176c8c08ed3d") {
              if (page.url) setShopUrl(`/${page.url}`);
              setIsShopPublished(published);
            } else if (page.id === "fd7e055c-bf17-4222-a8f8-c27b014d3062") {
              if (page.url) setStoreUrl(`/${page.url}`);
              setIsStorePublished(published);
            } else if (page.id === "90c6b3f6-1b46-4711-8882-28177874b51d") {
              if (page.url) setTrainingsUrl(`/${page.url}`);
              setIsTrainingsPublished(published);
            } else if (page.id === "f9709b0b-b513-4d53-a6ef-d9cda3f0a706") {
              if (page.url) setBlogUrl(`/${page.url}`);
              setIsBlogPublished(published);
            } else if (page.id === "eb40db10-0d10-47af-b102-62e2763bef86") {
              if (page.url) setHelpUrl(`/${page.url}`);
              setIsHelpPublished(published);
            } else if (page.id === "c131a31e-4c74-4b53-bdf5-d41a87e5b61b") {
              if (page.url) setContactUrl(`/${page.url}`);
              setIsContactPublished(published);
            } else if (page.id === "66f7d022-7935-430b-99d8-c6ce195f2d65") {
              if (page.url) setCompteUrl(`/${page.url}`);
              setIsComptePublished(published);
            } else if (page.url === "tarifs") {
              setIsTarifsPublished(published);
            } else if (page.url === "apps") {
              setIsAppsPublished(published);
            } else if (page.url === "press-kit") {
              setIsPressKitPublished(published);
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
 
  return {
    dashboardUrl,
    shopUrl,
    storeUrl,
    trainingsUrl,
    blogUrl,
    helpUrl,
    contactUrl,
    compteUrl,
    isDashboardPublished,
    isShopPublished,
    isStorePublished,
    isTrainingsPublished,
    isBlogPublished,
    isHelpPublished,
    isContactPublished,
    isComptePublished,
    isTarifsPublished,
    isAppsPublished,
    isPressKitPublished,
    isLoading,
  };
}
