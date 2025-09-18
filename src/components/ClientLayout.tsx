"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import AdminHeader from "@/components/AdminHeader";
import Footer from "@/components/Footer";
import { UserProvider } from "@/context/UserContext";
import SupabaseProvider from "@/components/SupabaseProvider";
import AuthDebug from "@/components/AuthDebug";

type Props = {
  children: React.ReactNode;
  plan?: string | null; // ← nouvelle prop optionnelle
};

export default function ClientLayout({ children, plan: _plan }: Props) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <SupabaseProvider>
      <UserProvider>
        {isAdminPage ? <AdminHeader /> : <Header />}
        {children}
        {!isAdminPage && <Footer />}
        {process.env.NODE_ENV === "development" && <AuthDebug />}
      </UserProvider>
    </SupabaseProvider>
  );
}
