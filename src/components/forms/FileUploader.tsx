"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const DEFAULT_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf", "mp4", "mov", "webm"];
const DEFAULT_ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
    "video/mp4",
    "video/quicktime",
    "video/webm",
];
const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.mp4,.mov,.webm";

type Props = {
    value: string[];
    onChange: (urls: string[]) => void;
    accept?: string;
    maxFiles?: number;
    maxSizeInMB?: number;
    allowedExtensions?: string[];
    showHelperText?: boolean;
};

export default function FileUploader({
    value,
    onChange,
    accept = DEFAULT_ACCEPT,
    maxFiles = 5,
    maxSizeInMB = 20,
    allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
    showHelperText = true,
}: Props) {
    const pathname = usePathname();
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isPageAdmin =
        pathname?.startsWith("/admin") ||
        hostname.startsWith("admin.") ||
        hostname.includes("admin") ||
        pathname?.startsWith("/program") ||
        pathname?.startsWith("/program-store") ||
        pathname?.startsWith("/offer-shop") ||
        pathname?.startsWith("/content-blog") ||
        pathname?.startsWith("/help") ||
        pathname?.startsWith("/users") ||
        pathname?.startsWith("/create-") ||
        pathname?.startsWith("/slider") ||
        pathname?.startsWith("/legal") ||
        pathname?.startsWith("/administrateurs") ||
        pathname?.startsWith("/auteurs") ||
        pathname?.startsWith("/settings");

    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);
    const inputRef = useRef<HTMLInputElement>(null);

    const isAtMaxFiles = value.length >= maxFiles;

    useEffect(() => {
        if (value.length === 0 && error) {
            setError(null);
        }
    }, [value.length, error]);

    const uploadFiles = async (fileList: FileList | null) => {
        const rawFiles = Array.from(fileList || []);
        if (rawFiles.length === 0) return;

        setError(null);

        // 1. Check if already at max files
        if (value.length >= maxFiles) {
            setError(`Vous avez déjà atteint la limite maximale de ${maxFiles} fichiers`);
            return;
        }

        const maxSizeBytes = maxSizeInMB * 1024 * 1024;
        const validFiles: File[] = [];
        const errorMessages: string[] = [];

        for (const file of rawFiles) {
            // Check batch count limit
            if (value.length + validFiles.length >= maxFiles) {
                errorMessages.push(`Limite de ${maxFiles} fichiers atteinte`);
                break;
            }

            // Check format
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            const isExtValid = allowedExtensions.includes(ext);
            const isMimeValid = accept === "image/*"
                ? file.type.startsWith("image/")
                : file.type
                ? DEFAULT_ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())
                : isExtValid;

            if (!isExtValid && !isMimeValid) {
                if (!errorMessages.includes("Format non autorisé")) {
                    errorMessages.push("Format non autorisé");
                }
                continue;
            }

            // Check size
            if (file.size > maxSizeBytes) {
                if (!errorMessages.includes("Fichier trop volumineux")) {
                    errorMessages.push("Fichier trop volumineux");
                }
                continue;
            }

            validFiles.push(file);
        }

        if (errorMessages.length > 0) {
            setError(errorMessages.join(" "));
        }

        if (validFiles.length === 0) {
            if (inputRef.current) {
                inputRef.current.value = "";
            }
            return;
        }

        setLoading(true);
        try {
            const newUrls: string[] = [];

            for (const file of validFiles) {
                // Replace spaces and special chars in the original name to avoid URL issues
                const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${safeOriginalName}`;
                const filePath = `attachements/${fileName}`;

                const { error: uploadError } = await supabase
                    .storage
                    .from("contact-attachments")
                    .upload(filePath, file, { upsert: true });

                if (uploadError) {
                    console.error("Supabase Storage error:", uploadError);
                    throw uploadError;
                }

                const { data } = supabase
                    .storage
                    .from("contact-attachments")
                    .getPublicUrl(filePath);

                if (!data?.publicUrl) throw new Error("Impossible d'obtenir l'URL publique");

                newUrls.push(data.publicUrl);
            }

            onChange([...value, ...newUrls]);
        } catch (err) {
            console.error("Erreur d'upload :", err);
            setError("Une erreur est survenue lors du téléchargement d'un ou plusieurs fichiers");
        } finally {
            setLoading(false);
            if (inputRef.current) {
                inputRef.current.value = ""; // Reset input so same file can be selected again
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        uploadFiles(e.target.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAtMaxFiles && !loading) {
            setIsDragging(true);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAtMaxFiles && !loading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isAtMaxFiles || loading) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleClick = () => {
        if (isAtMaxFiles || loading) return;
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    const handleRemove = (e: React.MouseEvent, indexToRemove: number) => {
        e.stopPropagation();
        const updatedUrls = value.filter((_, index) => index !== indexToRemove);
        onChange(updatedUrls);
        if (error && updatedUrls.length < maxFiles) {
            setError(null);
        }
    };

    return (
        <div className="w-full">
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative h-[45px] w-full flex items-center justify-center rounded-[5px] text-[14px] transition-all duration-150 ${
                    isAtMaxFiles
                        ? "bg-[#F2F1F6] cursor-not-allowed"
                        : "bg-white cursor-pointer"
                }`}
            >
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none rounded-[5px]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        x="0.5"
                        y="0.5"
                        width="calc(100% - 1px)"
                        height="calc(100% - 1px)"
                        rx="5"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        className={`transition-colors duration-150 ${
                            isAtMaxFiles
                                ? "stroke-[#D7D4DC]"
                                : isDragging
                                ? isPageAdmin
                                    ? "stroke-[#5D6494]"
                                    : "stroke-[#A1A5FD]"
                                : "stroke-[#D7D4DC] group-hover:stroke-[#C2BFC6]"
                        }`}
                    />
                </svg>
                {loading ? (
                    <span className="text-[#5D6494] font-semibold">Téléchargement en cours...</span>
                ) : isAtMaxFiles ? (
                    <span className="text-[#D7D4DC] font-semibold">
                        Limite de pièces jointes atteinte
                    </span>
                ) : (
                    <>
                        {/* Version mobile */}
                        <span className={`sm:hidden font-semibold ${isPageAdmin ? "text-[#5D6494]" : "text-[#7069FA]"}`}>
                            Ajouter vos fichiers ici
                        </span>
                        {/* Version desktop */}
                        <span className="hidden sm:inline text-[#5D6494] font-semibold">
                            <span className={isPageAdmin ? "text-[#5D6494] font-semibold" : "text-[#7069FA] font-semibold"}>Ajouter vos fichiers</span>{" "}
                            ou faites glisser vos fichiers ici
                        </span>
                    </>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-2 text-[13px] font-semibold text-[#EF4F4E]">
                    {error}
                </div>
            )}

            {/* Helper description */}
            {showHelperText && (
                <div className="mt-1.5 text-[12px] font-medium text-[#D7D4DC] flex flex-wrap items-center justify-between gap-1">
                    <span>Formats acceptés : JPG, PNG, WEBP, HEIC, PDF, MP4, MOV, WEBM</span>
                    <span>Max. {maxSizeInMB} Mo ({value.length}/{maxFiles})</span>
                </div>
            )}

            {/* Display selected files below the dropzone */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full mt-3">
                    {value.map((url, index) => {
                        const fileName = url.split('/').pop() || `Fichier ${index + 1}`;
                        const nameParts = decodeURIComponent(fileName).split('-');
                        const displayFileName = nameParts.length > 2 ? nameParts.slice(2).join('-') : decodeURIComponent(fileName);

                        return (
                            <div key={index} className={`flex items-center gap-2 font-semibold text-[12px] px-3 py-[6px] rounded-full ${isPageAdmin ? "text-[#5D6494] bg-[#F4F5FE]" : "text-[#A1A5FD] bg-[#F4F3FF]"}`}>
                                <span className="truncate max-w-[150px]">{displayFileName}</span>
                                <button
                                    type="button"
                                    onClick={(e) => handleRemove(e, index)}
                                    className={isPageAdmin ? "text-[#5D6494] hover:text-[#3A416F] transition-colors leading-none font-bold text-[14px]" : "text-[#A1A5FD] hover:text-[#7069FA] transition-colors leading-none font-bold text-[14px]"}
                                    aria-label="Remove file"
                                >
                                    ✕
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            <input
                type="file"
                multiple
                ref={inputRef}
                onChange={handleFileChange}
                disabled={loading || isAtMaxFiles}
                accept={accept}
                className="hidden"
            />
        </div>
    );
}
