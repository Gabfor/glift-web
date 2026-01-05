"use client";

import { usePathname } from "next/navigation";
import ClientLayout from "@/components/ClientLayout";

import { Session } from "@supabase/supabase-js";

export default function ClientLayoutWrapper({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const pathname = usePathname();

  const isAuthPage =
    pathname?.startsWith("/connexion") ||
    pathname === "/reinitialiser-mot-de-passe";

  const isOnboardingAccountStep = pathname === "/inscription";

  const shouldUsePublicHeader = Boolean(isAuthPage || isOnboardingAccountStep);

  return (
    <ClientLayout disconnected={shouldUsePublicHeader} initialSession={initialSession}>{children}</ClientLayout>
  );
}
