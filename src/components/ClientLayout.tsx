'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';
import Header from './Header';
import UserProvider from '@/context/UserContext';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {}
    );
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  console.log('✅ ClientLayout rendu pour', pathname);

  return (
    <UserProvider>
      <Header />
      <main>{children}</main>
    </UserProvider>
  );
}
