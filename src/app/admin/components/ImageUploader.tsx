"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export default function ImageUploader({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const requireSession = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // 🔐 Guard: ensure a session exists (handles “non-remembered” cases)
      const session = await requireSession();
      if (!session) {
        alert("Votre session a expiré. Merci de vous reconnecter.");
        window.location.href = `/connexion?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      // Nom de fichier unique
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `programmes/${fileName}`;

      // Upload (Storage)
      const { error } = await supabase
        .storage
        .from("program-images")
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error("Supabase Storage error:", error);
        throw error;
      }

      // URL publique
      const { data } = supabase.storage.from("program-images").getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("Impossible d'obtenir l'URL publique");

      onChange(data.publicUrl);
    } catch (err) {
      console.error("Erreur d'upload :", err);
      alert("Erreur lors de l'upload de l'image.");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`
          h-[45px] w-full px-[15px] rounded-[5px]
          border-2 border-dashed border-[#D7D4DC]
          hover:border-[#C2BFC6]
          focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
          transition-all duration-150 flex items-center justify-between
          ${loading ? "cursor-wait" : "cursor-pointer"}
          ${loading ? "bg-[#F2F1F6]" : "bg-white"}
        `}
      >
        <span className="text-[16px] font-semibold text-[#D7D4DC]">
          {loading ? "Upload en cours..." : "Importer un fichier"}
        </span>
        <Image
          src={value ? "/icons/success.svg" : "/icons/upload.svg"}
          alt={value ? "Succès" : "Upload Icon"}
          width={20}
          height={20}
        />
      </button>

      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
      />
    </div>
  );
}
