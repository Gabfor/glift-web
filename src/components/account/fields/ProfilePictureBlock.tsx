"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Camera, Trash2 } from "lucide-react"
import Tooltip from "@/components/Tooltip"

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

type Props = {
  imageUrl: string | null | undefined
  profileCompletion: number
  onImageChange: (file: File) => Promise<string> | string
  onImageRemove: () => Promise<void> | void
  isBusy?: boolean
}

const clampPercentage = (value: number) => {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.round(value)
}

export default function ProfilePictureBlock({
  imageUrl,
  profileCompletion,
  onImageChange,
  onImageRemove,
  isBusy = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localBusy, setLocalBusy] = useState(false)

  const working = isBusy || localBusy
  const pct = useMemo(() => clampPercentage(profileCompletion), [profileCompletion])
  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.has(file.type)) {
      alert("Formats autorisés : JPG, PNG, WebP ou AVIF.")
      input.value = ""
      return
    }

    setLocalBusy(true)
    try {
      await onImageChange(file)
    } catch (uploadError) {
      console.error("Avatar upload failed", uploadError)
    } finally {
      setLocalBusy(false)
      input.value = ""
    }
  }

  const openFileDialog = () => {
    if (working) return
    fileInputRef.current?.click()
  }

  const handleRemove = async () => {
    if (working || !hasImage) return
    setLocalBusy(true)
    try {
      await onImageRemove()
    } catch (removeError) {
      console.error("Avatar removal failed", removeError)
    } finally {
      setLocalBusy(false)
    }
  }

  const SIZE = 100
  const RADIUS = 46
  const STROKE = 6

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-[368px] flex flex-col items-center mb-4">
        <div className="relative w-[100px] h-[100px]">
          <svg className="absolute inset-0" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              stroke="#ECE9F1"
              strokeWidth={STROKE}
              fill="none"
            />
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
            <div className="relative w-[75px] h-[75px] rounded-full overflow-hidden bg-[#ECE9F1]">
              {hasImage ? (
                <Image
                  key={imageUrl}
                  src={imageUrl as string}
                  alt="Photo de profil"
                  fill
                  className="object-cover"
                  sizes="75px"
                />
              ) : null}
            </div>
          </div>
        </div>

        <Tooltip
          content={hasImage ? "Supprimer la photo" : "Aucune photo"}
          placement="top"
          offset={16}
          delay={400}
          disableHover={!hasImage || working}
        >
          <button
            type="button"
            onClick={handleRemove}
            disabled={!hasImage || working}
            aria-label="Supprimer la photo de profil"
            className="absolute left-[-52px] top-1/2 -translate-y-1/2"
          >
            <span
              className={`flex h-[46px] w-[46px] items-center justify-center rounded-full border ${
                hasImage && !working
                  ? "border-[#F3F2F7] bg-white hover:bg-[#F1EFF9]"
                  : "border-[#E4E1EB] bg-[#F7F6FB]"
              } shadow-[0px_4px_12px_rgba(112,105,250,0.08)] transition-colors`}
            >
              <Trash2
                className={`h-5 w-5 ${
                  hasImage && !working ? "text-[#7069FA]" : "text-[#C5C1D6]"
                }`}
                aria-hidden="true"
              />
            </span>
          </button>
        </Tooltip>

        <Tooltip content="Charger une photo" placement="top" offset={16} delay={400} disableHover={working}>
          <button
            type="button"
            onClick={openFileDialog}
            disabled={working}
            aria-label="Changer la photo de profil"
            className="absolute right-[-52px] top-1/2 -translate-y-1/2"
          >
            <span
              className={`flex h-[46px] w-[46px] items-center justify-center rounded-full border ${
                working ? "border-[#E4E1EB] bg-[#F7F6FB]" : "border-[#F3F2F7] bg-white hover:bg-[#F1EFF9]"
              } shadow-[0px_4px_12px_rgba(112,105,250,0.08)] transition-colors`}
            >
              <Camera
                className={`h-5 w-5 ${working ? "text-[#C5C1D6]" : "text-[#7069FA]"}`}
                aria-hidden="true"
              />
            </span>
          </button>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={handleFileChange}
          disabled={working}
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
  )
}
