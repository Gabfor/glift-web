"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import AdminHeader from "@/components/AdminHeader";
import AdminHeaderSimple from "@/app/admin/components/AdminHeaderSimple";
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
  isAdminSubdomain: boolean;
}

import { GlobalLoaderProvider, useGlobalLoader } from "@/context/GlobalLoaderContext";

export default function ClientLayout({
  children,
  disconnected = false,
  initialSession,
  isAdminSubdomain,
}: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin") || isAdminSubdomain;
  const isComptePage = pathname?.startsWith("/compte");

  return (
    <SupabaseProvider initialSession={initialSession}>
      <UserProvider>
        <GlobalLoaderProvider>
          <ClientLayoutContent
            disconnected={disconnected}
            isAdminPage={Boolean(isAdminPage)}
            isComptePage={Boolean(isComptePage)}
            isAdminSubdomain={isAdminSubdomain}
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
  isAdminSubdomain: boolean;
}

import MatrixRainBackground from "@/components/ui/MatrixRainBackground";

function ClientLayoutContent({
  children,
  disconnected,
  isAdminPage,
  isComptePage,
  isAdminSubdomain,
}: ClientLayoutContentProps) {
  const { isLoading, isAuthenticated } = useUser();
  const { isGlobalLoading } = useGlobalLoader();
  const pathname = usePathname();
  const shouldForceDisconnected = disconnected || !isAuthenticated;

  // Combine auth loading and manual global loading
  const showLoader = useMinimumVisibility(isLoading || isGlobalLoading);

  const isAdminAuthPage =
    pathname === "/admin/connexion" ||
    pathname === "/admin/reinitialiser-mot-de-passe" ||
    (isAdminSubdomain && (pathname === "/connexion" || pathname === "/reinitialiser-mot-de-passe"));

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFCFE]">
      {showLoader ? (
        <GliftLoader className={isComptePage ? "bg-white" : undefined} isAdmin={isAdminPage} />
      ) : null}
      {isAdminPage && <MatrixRainBackground opacity={0.25} />}
      {isAdminPage ? (
        isAdminAuthPage || !isAuthenticated ? (
          <AdminHeaderSimple />
        ) : (
          <AdminHeader />
        )
      ) : (
        <Header disconnected={shouldForceDisconnected} />
      )}
      <div className={`flex-1 flex flex-col ${isAdminPage ? "relative z-10" : ""}`}>
        {children}
      </div>
      {!isAdminPage && <Footer className="mt-[50px] md:mt-[100px]" />}
      {process.env.NODE_ENV === "development" && <AuthDebug />}
    </div>
  );
}
