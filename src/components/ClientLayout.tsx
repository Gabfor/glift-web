"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import AdminHeader from "@/components/AdminHeader";
import Footer from "@/components/Footer";
import { useUser, UserProvider } from "@/context/UserContext";
import SupabaseProvider from "@/components/SupabaseProvider";
import type { SupabaseSessionScope } from "@/lib/supabase/sessionScope";
import AuthDebug from "@/components/AuthDebug";
import GliftLoader from "@/components/ui/GliftLoader";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";

interface ClientLayoutProps {
  children: React.ReactNode;
  disconnected?: boolean;
}

export default function ClientLayout({ children, disconnected = false }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isComptePage = pathname?.startsWith("/compte");

  const sessionScope: SupabaseSessionScope = isAdminPage ? "admin" : "front";

  return (
    <SupabaseProvider scope={sessionScope}>
      <UserProvider scope={sessionScope}>
        <ClientLayoutContent
          disconnected={disconnected}
          isAdminPage={Boolean(isAdminPage)}
          isComptePage={Boolean(isComptePage)}
        >
          {children}
        </ClientLayoutContent>
      </UserProvider>
    </SupabaseProvider>
  );
}

interface ClientLayoutContentProps {
  children: React.ReactNode;
  disconnected: boolean;
  isAdminPage: boolean;
  isComptePage: boolean;
}

function ClientLayoutContent({
  children,
  disconnected,
  isAdminPage,
  isComptePage,
}: ClientLayoutContentProps) {
  const { isLoading, isAuthenticated } = useUser();
  const shouldForceDisconnected = disconnected && !isAuthenticated;
  const showLoader = useMinimumVisibility(isLoading);

  return (
    <>
      {showLoader ? (
        <GliftLoader className={isComptePage ? "bg-white" : undefined} />
      ) : null}
      {isAdminPage ? (
        <AdminHeader />
      ) : (
        <Header disconnected={shouldForceDisconnected} />
      )}
      {children}
      {!isAdminPage && <Footer />}
      {process.env.NODE_ENV === "development" && <AuthDebug />}
    </>
  );
}
