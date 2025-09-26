"use client";

import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import FooterPublic from "./FooterPublic";
import { UserProvider, useUser } from "@/context/UserContext";
import SupabaseProvider from "./SupabaseProvider";
import { AvatarProvider } from "@/context/AvatarContext";
import type { Session } from "@supabase/supabase-js";

function LayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser();

  return (
    <>
      <Header />
      <main>{children}</main>
      {isAuthenticated ? <Footer /> : <FooterPublic />}
    </>
  );
}

type ClientLayoutProps = {
  children: ReactNode;
  initialSession?: Session | null;
  initialIsPremiumUser?: boolean;
};

export default function ClientLayout({
  children,
  initialSession,
  initialIsPremiumUser,
}: ClientLayoutProps) {
  return (
    <SupabaseProvider>
      <UserProvider
        initialSession={initialSession}
        initialIsPremiumUser={initialIsPremiumUser}
      >
        <AvatarProvider>
          <LayoutContent>{children}</LayoutContent>
        </AvatarProvider>
      </UserProvider>
    </SupabaseProvider>
  );
}
