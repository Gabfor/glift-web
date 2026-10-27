"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import AdminHeader from "@/components/AdminHeader";
import AdminHeaderSimple from "@/app/admin/components/AdminHeaderSimple";
import Footer from "@/components/Footer";
import { useUser, UserProvider } from "@/context/UserContext";
import SupabaseProvider from "@/components/SupabaseProvider";
import GliftLoader from "@/components/ui/GliftLoader";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import type { Session } from "@supabase/supabase-js";
import dynamic from "next/dynamic";

const MatrixRainBackground = dynamic(
  () => import("@/components/ui/MatrixRainBackground"),
  { ssr: false }
);

const AuthDebug = dynamic(
  () => import("@/components/AuthDebug"),
  { ssr: false }
);

interface ClientLayoutProps {
  children: React.ReactNode;
  disconnected?: boolean;
  initialSession: Session | null;
  isAdminSubdomain?: boolean;
}

import { GlobalLoaderProvider, useGlobalLoader } from "@/context/GlobalLoaderContext";

export default function ClientLayout({
  children,
  disconnected = false,
  initialSession,
  isAdminSubdomain,
}: ClientLayoutProps) {
  const pathname = usePathname();
  const isSubdomain =
    isAdminSubdomain ??
    (typeof window !== "undefined" ? window.location.hostname.startsWith("admin.") : false);
  const isAdminPage = Boolean(pathname?.startsWith("/admin") || isSubdomain);
  const isComptePage = pathname?.startsWith("/compte");

  return (
    <SupabaseProvider initialSession={initialSession}>
      <UserProvider>
        <GlobalLoaderProvider>
          <ClientLayoutContent
            disconnected={disconnected}
            isAdminPage={isAdminPage}
            isComptePage={Boolean(isComptePage)}
            isAdminSubdomain={isSubdomain}
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

  const isAdminAuthPage =
    pathname === "/admin/connexion" ||
    pathname === "/admin/reinitialiser-mot-de-passe" ||
    (isAdminSubdomain && (pathname === "/connexion" || pathname === "/reinitialiser-mot-de-passe"));

  // Routes protégées qui requièrent d'attendre la validation d'authentification
  const isLogoutPage = pathname === "/deconnexion";
  const isProtectedRoute = !isLogoutPage && Boolean(
    pathname?.startsWith("/tableau-de-bord") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/entrainements") ||
    pathname?.startsWith("/compte") ||
    (isAdminPage && !isAdminAuthPage)
  );

  // Les pages publiques (accueil, blog, store, shop, etc.) s'affichent instantanément
  // sans être masquées par un loader plein écran pendant l'appel auth/profil.
  const shouldBlockWithLoader = isGlobalLoading || (isLoading && isProtectedRoute);
  const showLoader = useMinimumVisibility(shouldBlockWithLoader);

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
