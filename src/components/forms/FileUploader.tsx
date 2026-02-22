"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

type Props = {
    value: string[];
    onChange: (urls: string[]) => void;
};

export default function FileUploader({
    value,
    onChange,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const supabase = useMemo(() => createClient(), []);
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadFiles = async (fileList: FileList | null) => {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        setLoading(true);
        try {
            const newUrls: string[] = [];

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                // Replace spaces and special chars in the original name to avoid URL issues
                const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${safeOriginalName}`;
                const filePath = `attachements/${fileName}`;

                const { error } = await supabase
                    .storage
                    .from("contact-attachments")
                    .upload(filePath, file, { upsert: true });

                if (error) {
                    console.error("Supabase Storage error:", error);
                    throw error;
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
            alert("Erreur lors de l'upload d'un ou plusieurs fichiers.");
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
        setIsDragging(true);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleClick = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    const handleRemove = (e: React.MouseEvent, indexToRemove: number) => {
        e.stopPropagation();
        const updatedUrls = value.filter((_, index) => index !== indexToRemove);
        onChange(updatedUrls);
    }

    return (
        <div className="w-full">
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`h-[45px] w-full flex items-center justify-center rounded-[5px] bg-white border border-dashed text-[14px] cursor-pointer transition-all duration-150 ${isDragging ? "border-[#A1A5FD] bg-[#F4F3FF]" : "border-[#D7D4DC] hover:border-[#C2BFC6]"
                    }`}
            >
                {loading ? (
                    <span className="text-[#5D6494] font-semibold">Téléchargement en cours...</span>
                ) : (
                    <span className="text-[#5D6494] font-semibold">
                        <span className="text-[#7069FA] font-semibold">Ajouter vos fichiers</span>{" "}
                        ou faites glisser vos fichiers ici
                    </span>
                )}
            </div>

            {/* Display selected files below the dropzone */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full mt-3">
                    {value.map((url, index) => {
                        const fileName = url.split('/').pop() || `Fichier ${index + 1}`;
                        // The uploaded file is formatted as: `[timestamp]-[random].[originalExt]`
                        // To get the closest to the original name, we can just extract everything after the first dash "-", 
                        // and then the second dash "-" because of the `Math.random().toString(36).substring(7)` part...
                        // Wait, actually earlier we just used `file.name.split('.').pop()` to get the extension. 
                        // The original filename INCLUDES the extension inside Supabase. Let's fix the upload logic to append the full original name.

                        // For the display, since we currently only uploaded `timestamp-random.ext`, the original name is lost in the DB.
                        // I will update the upload logic ABOVE so it includes the original name, and decode it here correctly.
                        const nameParts = decodeURIComponent(fileName).split('-');
                        // If it follows new format: timestamp-random-originalname.pdf
                        // We slice from index 2 onwards.
                        const displayFileName = nameParts.length > 2 ? nameParts.slice(2).join('-') : decodeURIComponent(fileName);

                        return (
                            <div key={index} className="flex items-center gap-2 text-[#A1A5FD] font-semibold text-[12px] bg-[#F4F3FF] px-3 py-[6px] rounded-full">
                                <span className="truncate max-w-[150px]">{displayFileName}</span>
                                <button
                                    type="button"
                                    onClick={(e) => handleRemove(e, index)}
                                    className="text-[#A1A5FD] hover:text-[#7069FA] transition-colors leading-none font-bold text-[14px]"
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
                disabled={loading}
                className="hidden"
            />
        </div>
    );
}
