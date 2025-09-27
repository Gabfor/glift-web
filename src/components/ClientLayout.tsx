"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import FooterPublic from "./FooterPublic";
import { UserProvider, useUser } from "@/context/UserContext";
import SupabaseProvider from "./SupabaseProvider";
import { AvatarProvider } from "@/context/AvatarContext";
import type { Session } from "@supabase/supabase-js";
import {
  clearSupabaseStorage,
  resetSupabaseClient,
} from "@/lib/supabase/client";

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
  useSupabaseLogoutSync();

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

function useSupabaseLogoutSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const INDICATOR_COOKIE = "glift-logout";
    const STORAGE_KEY = "glift:logout-signal";
    const CHANNEL_NAME = "glift:auth";

    let broadcastChannel: BroadcastChannel | null = null;

    const clearIndicator = () => {
      document.cookie = `${INDICATOR_COOKIE}=; path=/; max-age=0`;
    };

    const performLogoutCleanup = (shouldBroadcast: boolean) => {
      clearSupabaseStorage();
      resetSupabaseClient();

      if (shouldBroadcast) {
        try {
          localStorage.setItem(STORAGE_KEY, `${Date.now()}`);
        } catch (error) {
          console.warn("Unable to write logout signal to localStorage", error);
        }

        try {
          broadcastChannel?.postMessage({ type: "logout" });
        } catch (error) {
          console.warn("Unable to broadcast logout signal", error);
        }
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        performLogoutCleanup(false);
      }
    };

    window.addEventListener("storage", handleStorage);

    const handleBroadcast = (event: MessageEvent) => {
      if ((event.data as { type?: string } | undefined)?.type === "logout") {
        performLogoutCleanup(false);
      }
    };

    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.addEventListener("message", handleBroadcast);
    } catch (error) {
      console.warn("BroadcastChannel is not available", error);
      broadcastChannel = null;
    }

    const hasIndicator = () =>
      document.cookie
        .split(";")
        .map((entry) => entry.trim())
        .some((entry) => entry.startsWith(`${INDICATOR_COOKIE}=`));

    if (hasIndicator()) {
      clearIndicator();
      performLogoutCleanup(true);
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener("message", handleBroadcast);
        broadcastChannel.close();
      }
    };
  }, []);
}
