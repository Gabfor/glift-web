'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import Header from './Header';
import Footer from './Footer';
import FooterPublic from './FooterPublic';
import { UserProvider } from "@/context/UserContext"
import SupabaseProvider from './SupabaseProvider';
import { AvatarProvider } from '@/context/AvatarContext';
import { useUser } from "@/context/UserContext";

type LayoutContentProps = {
  children: ReactNode;
};

type ClientLayoutProps = {
  children: ReactNode;
  initialSession?: Session | null;
};

function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useUser();

  console.log('✅ ClientLayout rendu pour', pathname);

  return (
    <>
      <Header />
      <main>{children}</main>
      {isAuthenticated ? <Footer /> : <FooterPublic />}
    </>
  );
}

export default function ClientLayout({ children, initialSession = null }: ClientLayoutProps) {
  return (
    <SupabaseProvider>
      <UserProvider initialSession={initialSession}>
        <AvatarProvider>
          <LayoutContent>{children}</LayoutContent>
        </AvatarProvider>
      </UserProvider>
    </SupabaseProvider>
  );
}
