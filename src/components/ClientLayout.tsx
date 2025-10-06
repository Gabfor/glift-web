"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import AdminHeader from "@/components/AdminHeader";
import Footer from "@/components/Footer";
import { useUser, UserProvider } from "@/context/UserContext";
import SupabaseProvider from "@/components/SupabaseProvider";
import AuthDebug from "@/components/AuthDebug";
import GliftLoader from "@/components/ui/GliftLoader";

interface ClientLayoutProps {
  children: React.ReactNode;
  disconnected?: boolean;
}

export default function ClientLayout({ children, disconnected = false }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <SupabaseProvider>
      <UserProvider>
        <ClientLayoutContent
          disconnected={disconnected}
          isAdminPage={Boolean(isAdminPage)}
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
}

function ClientLayoutContent({
  children,
  disconnected,
  isAdminPage,
}: ClientLayoutContentProps) {
  const { isLoading } = useUser();

  if (isLoading) {
    return <GliftLoader />;
  }

  return (
    <>
      {isAdminPage ? (
        <AdminHeader />
      ) : (
        <Header disconnected={disconnected} />
      )}
      {children}
      {!isAdminPage && <Footer />}
      {process.env.NODE_ENV === "development" && <AuthDebug />}
    </>
  );
}
