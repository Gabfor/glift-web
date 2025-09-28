"use client";

import { useUser } from "@supabase/auth-helpers-react";
import FooterPublic from "./FooterPublic";
import FooterLogged from "./FooterLogged";

export default function Footer() {
  const user = useUser();

  return user ? <FooterLogged /> : <FooterPublic />;
}
