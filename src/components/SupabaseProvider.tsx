"use client";

import { ReactNode } from "react";

export default function SupabaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
