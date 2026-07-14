"use client";

import { useLayoutEffect } from "react";

import { usePathname } from "next/navigation";
import ClientLayout from "@/components/ClientLayout";

import { Session } from "@supabase/supabase-js";

export default function ClientLayoutWrapper({
  children,
  initialSession,
  isAdminSubdomain,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
  isAdminSubdomain: boolean;
}) {
  const pathname = usePathname();

  const isAuthPage =
    pathname?.startsWith("/connexion") ||
    pathname === "/reinitialiser-mot-de-passe" ||
    pathname?.startsWith("/admin/connexion") ||
    pathname === "/admin/reinitialiser-mot-de-passe";

  const isOnboardingAccountStep = pathname === "/inscription";

  const shouldUsePublicHeader = Boolean(isAuthPage || isOnboardingAccountStep);

  useLayoutEffect(() => {
    // Disable default browser scroll restoration
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    // Force scroll to top immediately
    window.scrollTo(0, 0);
  }, []);

  return (
    <ClientLayout disconnected={shouldUsePublicHeader} initialSession={initialSession} isAdminSubdomain={isAdminSubdomain}>{children}</ClientLayout>
  );
}
