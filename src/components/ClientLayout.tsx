"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import FooterPublic from "./FooterPublic";
import { UserProvider, useUser } from "@/context/UserContext";
import SupabaseProvider from "./SupabaseProvider";
import { AvatarProvider } from "@/context/AvatarContext";

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useUser();

  if (process.env.NEXT_PUBLIC_DEBUG === "1") {
    console.log("✅ ClientLayout rendu pour", pathname);
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      {isAuthenticated ? <Footer /> : <FooterPublic />}
    </>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      <UserProvider>
        <AvatarProvider>
          <LayoutContent>{children}</LayoutContent>
        </AvatarProvider>
      </UserProvider>
    </SupabaseProvider>
  );
}
