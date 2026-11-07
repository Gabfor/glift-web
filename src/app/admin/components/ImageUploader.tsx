"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import { compressImage } from "@/lib/imageCompression";

type Props = {
  label?: string;
  dimensions?: string;
  value: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  placeholder?: string;
  bucket?: string;
  basePath?: string;
  className?: string;
};

export default function ImageUploader({
  label,
  dimensions,
  value,
  onChange,
  onDelete,
  placeholder,
  bucket = 'program-images',
  basePath = 'programmes',
  className = '',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [localFileName, setLocalFileName] = useState<string>("");
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayFileName = useMemo(() => {
    if (localFileName) return localFileName;
    if (!value) return "";
    try {
      const decoded = decodeURIComponent(value);
      const clean = decoded.split("?")[0];
      return clean.split("/").pop() || "";
    } catch {
      return value.split("/").pop() || "";
    }
  }, [value, localFileName]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalFileName(file.name);
    setLoading(true);
    try {
      // Compression de l'image côté client
      const compressedFile = await compressImage(file);

      // Nom de fichier unique avec l'extension du fichier potentiellement compressé
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // Chemin dans le bucket
      const filePath = basePath ? `${basePath}/${fileName}` : fileName;

      // Upload dans Supabase Storage du fichier compressé
      const { error } = await supabase
        .storage
        .from(bucket)
        .upload(filePath, compressedFile, { upsert: true });

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
      setLocalFileName("");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFileName("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange("");
    if (onDelete) onDelete();
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <div className="flex justify-between items-baseline mb-[5px]">
          <span className="text-[16px] text-[#3A416F] font-bold">{label}</span>
          {value ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-[12px] mt-[3px] text-[#5D6494] font-semibold hover:text-[#3A416F] transition-colors cursor-pointer"
            >
              Supprimer
            </button>
          ) : dimensions ? (
            <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
              {dimensions}
            </span>
          ) : null}
        </div>
      )}

      <div
        onClick={handleClick}
        className="h-[45px] w-full px-[15px] rounded-[5px] bg-white cursor-pointer
                   border border-dashed border-[#D7D4DC]
                   hover:border-[#C2BFC6]
                   focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#5D6494]
                   transition-all duration-150 flex items-center justify-between"
      >
        <span
          className={`text-[16px] font-semibold truncate ${
            value ? "text-[#3A416F]" : "text-[#D7D4DC]"
          }`}
        >
          {loading
            ? "Upload en cours..."
            : value
              ? displayFileName
              : (placeholder || "Importer un fichier")}
        </span>
        <Image
          src={value ? "/icons/success.svg" : "/icons/upload.svg"}
          alt={value ? "Succès" : "Upload Icon"}
          width={20}
          height={20}
          className="shrink-0 ml-2"
        />
      </div>

      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        disabled={loading}
        className="hidden"
      />
    </div>
  );
}
