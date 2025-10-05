"use client";

import { usePathname } from "next/navigation";
import ClientLayout from "@/components/ClientLayout";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPublicPage =
    pathname?.startsWith("/connexion") ||
    pathname?.startsWith("/inscription") ||
    pathname === "/reinitialiser-mot-de-passe";

  return <ClientLayout disconnected={isPublicPage}>{children}</ClientLayout>;
}
