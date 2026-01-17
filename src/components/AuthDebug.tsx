"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "@/context/UserContext";

export default function AuthDebug() {
  const { user } = useUser();
  const supabase = useSupabaseClient();

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!user?.id) {
        if (isMounted) {
          setIsProfileLoading(false);
          setIsVerified(null);
        }
        return;
      }

      setIsProfileLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("id", user.id)
        .single();

      if (!isMounted) return;

      if (error || !data) {
        setIsVerified(null);
      } else {
        setIsVerified(data.email_verified ?? false);
      }

      setIsProfileLoading(false);
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [supabase, user?.id]);

  if (!user) return null;

  const isAuthenticated = !!user;
  const isPremiumUser = user.user_metadata?.is_premium === true;
  const verifiedLabel = isProfileLoading
    ? "Chargement..."
    : isVerified === null
      ? "Inconnu"
      : isVerified
        ? "Oui"
        : "Non";

  return (
    <div className="fixed bottom-2 right-2 bg-white border p-2 text-xs rounded shadow z-50 max-w-[280px]">
      <strong>Debug :</strong>
      <ul className="mt-1 space-y-1">
        <li>
          <strong>Email :</strong> {user.email}
        </li>
        <li>
          <strong>Authentifié :</strong> {isAuthenticated ? "Oui" : "Non"}
        </li>
        <li>
          <strong>Premium :</strong> {isPremiumUser ? "Oui" : "Non"}
        </li>
        <li>
          <strong>Vérifié :</strong> {verifiedLabel}
        </li>
      </ul>
    </div>
  );
}
