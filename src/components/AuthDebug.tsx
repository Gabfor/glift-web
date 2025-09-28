"use client";

import { useUser } from "@supabase/auth-helpers-react";

export default function AuthDebug() {
  const user = useUser();

  if (!user) return null;

  const isAuthenticated = !!user;
  const isPremiumUser = user.user_metadata?.is_premium === true;

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
      </ul>
    </div>
  );
}
