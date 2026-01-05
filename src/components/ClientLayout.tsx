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

export default function ClientLayout({ children, disconnected = false, initialSession }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isComptePage = pathname?.startsWith("/compte");

  return (
    <SupabaseProvider initialSession={initialSession}>
      <UserProvider>
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
