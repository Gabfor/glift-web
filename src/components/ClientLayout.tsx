"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import AdminHeader from "@/components/AdminHeader";
import Footer from "@/components/Footer";
import { useUser, UserProvider } from "@/context/UserContext";
import SupabaseProvider from "@/components/SupabaseProvider";
import AuthDebug from "@/components/AuthDebug";
import GliftLoader from "@/components/ui/GliftLoader";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";

import { Session } from "@supabase/supabase-js";

interface ClientLayoutProps {
  children: React.ReactNode;
  disconnected?: boolean;
  initialSession: Session | null;
}

import { GlobalLoaderProvider, useGlobalLoader } from "@/context/GlobalLoaderContext";

export default function ClientLayout({ children, disconnected = false, initialSession }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isComptePage = pathname?.startsWith("/compte");

  return (
    <SupabaseProvider initialSession={initialSession}>
      <UserProvider>
        <GlobalLoaderProvider>
          <ClientLayoutContent
            disconnected={disconnected}
            isAdminPage={Boolean(isAdminPage)}
            isComptePage={Boolean(isComptePage)}
          >
            {children}
          </ClientLayoutContent>
        </GlobalLoaderProvider>
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
  const { isGlobalLoading } = useGlobalLoader();
  const shouldForceDisconnected = disconnected && !isAuthenticated;

  // Combine auth loading and manual global loading
  const showLoader = useMinimumVisibility(isLoading || isGlobalLoading);

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
