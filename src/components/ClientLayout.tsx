'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';
import Header from './Header';
import Footer from './Footer';
import FooterPublic from './FooterPublic';
import { UserProvider } from "@/context/UserContext"
import SupabaseProvider from './SupabaseProvider';
import { AvatarProvider } from '@/context/AvatarContext';
import { useUser } from "@/context/UserContext";

function LayoutContent({ children }: { children: ReactNode }) {
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
