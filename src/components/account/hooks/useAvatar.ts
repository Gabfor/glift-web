"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"

import { useUser } from "@/context/UserContext"
import { createClient } from "@/lib/supabaseClient"

const DEFAULT_BUCKET = "avatars"

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return null
}

const sanitizeExtension = (file: File) => {
  const segments = file.name.split(".")
  if (segments.length <= 1) return "png"
  const extension = segments.pop() ?? ""
  const normalized = extension.toLowerCase().replace(/[^a-z0-9]/g, "")
  return normalized || "png"
}

type AvatarState = {
  url: string | null
  path: string | null
}

type UseAvatarResult = {
  avatarUrl: string | null
  displayUrl: string | null
  isWorking: boolean
  error: string | null
  uploadAvatar: (file: File) => Promise<string>
  removeAvatar: () => Promise<void>
}

const formatErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

const extractInitialState = (
  metadata: Record<string, unknown> | undefined,
): AvatarState => ({
  url: toStringOrNull(metadata?.avatar_url),
  path: toStringOrNull(metadata?.avatar_path),
})

export const useAvatar = (user: User | null): UseAvatarResult => {
  const supabase = useMemo(() => createClient(), [])
  const { updateUserMetadata } = useUser()
  const initialState = useMemo(
    () => extractInitialState(user?.user_metadata as Record<string, unknown> | undefined),
    [user?.user_metadata],
  )

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialState.url)
  const [avatarPath, setAvatarPath] = useState<string | null>(initialState.path)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET?.trim() || DEFAULT_BUCKET

  const releasePreview = useCallback((candidate: string | null) => {
    if (!candidate || !candidate.startsWith("blob:")) return
    try {
      URL.revokeObjectURL(candidate)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    setAvatarUrl(initialState.url)
    setAvatarPath(initialState.path)
  }, [initialState.path, initialState.url])

  useEffect(() => {
    return () => {
      releasePreview(previewRef.current)
    }
  }, [releasePreview])

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user?.id) {
        const message = "Vous devez être connecté pour modifier votre photo."
        setError(message)
        throw new Error(message)
      }

      if (isWorking) {
        return avatarUrl ?? ""
      }

      const nextPreview = URL.createObjectURL(file)
      if (previewRef.current && previewRef.current !== nextPreview) {
        releasePreview(previewRef.current)
      }

      previewRef.current = nextPreview
      setPreviewUrl(nextPreview)
      setIsWorking(true)
      setError(null)

      try {
        const extension = sanitizeExtension(file)
        const objectPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(objectPath, file, { cacheControl: "3600", upsert: true })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData, error: publicUrlError } = supabase.storage
          .from(bucket)
          .getPublicUrl(objectPath)

        if (publicUrlError) {
          throw publicUrlError
        }

        const publicUrl = publicUrlData?.publicUrl
        if (!publicUrl) {
          throw new Error("Impossible de récupérer l'URL de la photo.")
        }

        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            avatar_url: publicUrl,
            avatar_path: objectPath,
          },
        })

        if (updateError) {
          throw updateError
        }

        const previousPath = avatarPath
        setAvatarUrl(publicUrl)
        setAvatarPath(objectPath)
        setError(null)
        updateUserMetadata({
          avatar_url: publicUrl,
          avatar_path: objectPath,
        })

        if (previousPath && previousPath !== objectPath) {
          void supabase.storage
            .from(bucket)
            .remove([previousPath])
            .catch(() => {
              // best-effort cleanup
            })
        }

        return publicUrl
      } catch (uploadError) {
        setError(
          formatErrorMessage(
            uploadError,
            "Impossible de charger la photo. Veuillez réessayer.",
          ),
        )
        throw uploadError
      } finally {
        setIsWorking(false)
        setPreviewUrl(null)
        releasePreview(previewRef.current)
        previewRef.current = null
      }
    },
    [
      avatarPath,
      avatarUrl,
      bucket,
      isWorking,
      releasePreview,
      supabase,
      updateUserMetadata,
      user?.id,
    ],
  )

  const removeAvatar = useCallback(async () => {
    if (isWorking) {
      return
    }

    if (!user?.id) {
      const message = "Vous devez être connecté pour modifier votre photo."
      setError(message)
      throw new Error(message)
    }

    setIsWorking(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: null,
          avatar_path: null,
        },
      })

      if (updateError) {
        throw updateError
      }

      const pathToRemove = avatarPath
      setAvatarUrl(null)
      setAvatarPath(null)
      setPreviewUrl(null)
      updateUserMetadata({
        avatar_url: null,
        avatar_path: null,
      })

      if (pathToRemove) {
        await supabase.storage
          .from(bucket)
          .remove([pathToRemove])
          .catch(() => {
            // ignore cleanup failure
          })
      }
    } catch (removeError) {
      setError(
        formatErrorMessage(
          removeError,
          "Impossible de supprimer la photo actuellement. Veuillez réessayer.",
        ),
      )
      throw removeError
    } finally {
      setIsWorking(false)
      releasePreview(previewRef.current)
      previewRef.current = null
    }
  }, [
    avatarPath,
    bucket,
    isWorking,
    releasePreview,
    supabase,
    updateUserMetadata,
    user?.id,
  ])

  const displayUrl = previewUrl ?? avatarUrl

  return {
    avatarUrl,
    displayUrl,
    isWorking,
    error,
    uploadAvatar,
    removeAvatar,
  }
}

export type { UseAvatarResult }
