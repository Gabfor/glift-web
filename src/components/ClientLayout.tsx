'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';
import Header from './Header';
import Footer from './Footer';
import FooterPublic from './FooterPublic';
import UserProvider, { useUser } from '@/context/UserContext';
import SupabaseProvider from './SupabaseProvider';
import { AvatarProvider } from '@/context/AvatarContext';

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
  const supabase = createClientComponentClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: string, _session: Session | null) => {}
    );
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

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
