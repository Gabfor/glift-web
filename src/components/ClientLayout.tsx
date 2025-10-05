"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import AdminHeader from "@/components/AdminHeader";
import Footer from "@/components/Footer";
import { UserProvider } from "@/context/UserContext";
import SupabaseProvider from "@/components/SupabaseProvider";
import AuthDebug from "@/components/AuthDebug";

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
        {isAdminPage ? (
          <AdminHeader />
        ) : (
          <Header disconnected={disconnected} />
        )}
        {children}
        {!isAdminPage && <Footer />}
        {process.env.NODE_ENV === "development" && <AuthDebug />}
      </UserProvider>
    </SupabaseProvider>
  );
}
