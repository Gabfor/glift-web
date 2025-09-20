"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Tooltip from "@/components/Tooltip";
import { useAvatar } from "@/context/AvatarContext";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

type Props = {
  imageUrl: string | null | undefined;
  profileCompletion: number;
  onImageChange: (file: File) => Promise<string> | string;
  onImageRemove: () => Promise<void> | void;
};

export default function ProfilePictureBlock({
  imageUrl,
  profileCompletion,
  onImageChange,
  onImageRemove,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoHover, setPhotoHover] = useState(false);
  const [deleteHover, setDeleteHover] = useState(false);
  const [tooltipEpoch, setTooltipEpoch] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const { avatarUrl, setAvatarUrl } = useAvatar();

  const effectiveUrl =
    typeof imageUrl === "string" && imageUrl.trim().length > 0 ? imageUrl : avatarUrl;

  const prevUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevUrlRef.current;
    if (prev && prev.startsWith("blob:") && prev !== effectiveUrl) {
      try {
        URL.revokeObjectURL(prev);
      } catch {}
    }
    prevUrlRef.current = effectiveUrl ?? null;
  }, [effectiveUrl]);

  useEffect(() => {
    if (typeof imageUrl === "string" && imageUrl.trim().length > 0) {
      setAvatarUrl(imageUrl);
    }
  }, [imageUrl, setAvatarUrl]);

  const resetTooltips = () => {
    setPhotoHover(false);
    setDeleteHover(false);
    setTooltipEpoch((c) => c + 1);
    if (document.activeElement instanceof HTMLElement) {
      try {
        document.activeElement.blur();
      } catch {}
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    if (!ALLOWED.has(file.type)) {
      alert("Formats autorisés : JPG, PNG, WebP, AVIF.");
      inputEl.value = "";
      resetTooltips();
      return;
    }
    const result = await onImageChange(file);
    if (typeof result === "string") setAvatarUrl(result);
    inputEl.value = "";
    resetTooltips();
  };

  const openFileDialog = () => {
    if (isWorking) return;
    fileInputRef.current?.click();
  };

  const handleRemoveClick = async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      await onImageRemove();
      setAvatarUrl(null);
    } finally {
      setIsWorking(false);
      resetTooltips();
    }
  };

  const SIZE = 100;
  const RADIUS = 46;
  const STROKE = 6;
  const pct = Math.max(0, Math.min(100, Math.round(profileCompletion)));
  const hasImage = Boolean(effectiveUrl && effectiveUrl.trim().length > 0);

  return (
    <div className="flex flex-col items-center mb-6 mt-[30px]">
      <div className="relative w-[100px] h-[100px] mb-2">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx="50" cy="50" r={RADIUS} stroke="#ECE9F1" strokeWidth={STROKE} fill="none" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            stroke="#33E1AC"
            strokeWidth={STROKE}
            fill="none"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - pct}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 300ms ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[75px] h-[75px] rounded-full overflow-hidden">
            {hasImage ? (
              <Image
                key={effectiveUrl || "noimg"}
                src={effectiveUrl as string}
                alt="Photo de profil"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#ECE9F1]" />
            )}
          </div>
        </div>

        <Tooltip
          key={`del-${tooltipEpoch}`}
          content={hasImage ? "Supprimer la photo" : "Aucune photo"}
          placement="top"
          delay={400}
          offset={16}
        >
          <button
            type="button"
            onClick={handleRemoveClick}
            className="absolute left-[-48px] top-1/2 -translate-y-1/2 hover:opacity-80 disabled:opacity-40"
            aria-label="Supprimer la photo de profil"
            disabled={!hasImage || isWorking}
          >
            <Image
              src={
                deleteHover && hasImage && !isWorking
                  ? "/icons/delete_photo_hover.svg"
                  : "/icons/delete_photo.svg"
              }
              alt="Supprimer"
              width={30}
              height={30}
            />
          </button>
        </Tooltip>

        <Tooltip
          key={`photo-${tooltipEpoch}`}
          content="Charger une photo"
          placement="top"
          delay={400}
          offset={16}
        >
          <button
            type="button"
            onClick={openFileDialog}
            className="absolute right-[-48px] top-1/2 -translate-y-1/2 hover:opacity-80 disabled:opacity-40"
            aria-label="Changer la photo de profil"
            disabled={isWorking}
          >
            <Image
              src={
                photoHover && !isWorking ? "/icons/photo_hover.svg" : "/icons/photo.svg"
              }
              alt="Changer"
              width={30}
              height={30}
            />
          </button>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={handleFileChange}
          className="hidden"
          disabled={isWorking}
        />
      </div>

      <p className="text-base font-semibold text-[#3A416F]">
        Votre profil est complet à{" "}
        <span className="inline-flex w-[5ch] tabular-nums text-left justify-start">
          <span className="text-[#33E1AC]">{pct}%</span>
          <span className="text-[#3A416F]">.</span>
        </span>
      </p>
    </div>
  );
}
