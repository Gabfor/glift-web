"use client";

import { usePathname } from "next/navigation";
import ClientLayout from "@/components/ClientLayout";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage =
    pathname?.startsWith("/connexion") ||
    pathname === "/reinitialiser-mot-de-passe";

  const isOnboardingAccountStep = pathname === "/inscription";

  const shouldUsePublicHeader = Boolean(isAuthPage || isOnboardingAccountStep);

  return (
    <ClientLayout disconnected={shouldUsePublicHeader}>{children}</ClientLayout>
  );
}
