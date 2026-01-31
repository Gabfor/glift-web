"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";

type Props = {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  bucket?: string;
  basePath?: string;
};

export default function ImageUploader({
  value,
  onChange,
  placeholder,
  bucket = 'program-images',
  basePath = 'programmes'
}: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // Chemin dans le bucket
      const filePath = `${basePath}/${fileName}`;

      // Upload dans Supabase Storage
      const { error } = await supabase
        .storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error("Supabase Storage error:", error);
        throw error;
      }

      // Récupération de l'URL publique
      const { data } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) throw new Error("Impossible d'obtenir l'URL publique");

      onChange(data.publicUrl);
    } catch (err) {
      console.error("Erreur d'upload :", err);
      alert("Erreur lors de l'upload de l'image.");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={handleClick}
        className="h-[45px] w-full px-[15px] rounded-[5px] bg-white cursor-pointer
                   border border-dashed border-[#D7D4DC]
                   hover:border-[#C2BFC6]
                   focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#A1A5FD]
                   transition-all duration-150 flex items-center justify-between"
      >
        <span className="text-[16px] font-semibold text-[#D7D4DC]">
          {loading ? "Upload en cours..." : (placeholder || "Importer un fichier")}
        </span>
        <Image
          src={value ? "/icons/success.svg" : "/icons/upload.svg"}
          alt={value ? "Succès" : "Upload Icon"}
          width={20}
          height={20}
          className=""
        />
      </div>

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
