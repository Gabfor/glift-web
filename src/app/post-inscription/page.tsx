"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import GliftLoader from "@/components/ui/GliftLoader";
import { useUser } from "@/context/UserContext";

export default function PostInscription() {
  const params = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();

  const email = params?.get("email")?.trim() ?? "";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sanitizedUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(null, "", sanitizedUrl);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const destination = isAuthenticated
      ? "/dashboard"
      : `/connexion${email ? `?email=${encodeURIComponent(email)}` : ""}`;

    router.replace(destination);
  }, [email, isAuthenticated, isLoading, router]);

  return <GliftLoader />;
}
