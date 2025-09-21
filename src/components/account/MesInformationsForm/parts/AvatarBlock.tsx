'use client'
import ProfilePictureBlock from '@/components/account/fields/ProfilePictureBlock'

type Props = {
  profileImageUrl: string
  profileCompletion: number
  setAvatarUi: (url: string) => void
  uploadAvatar: (file: File, onDone: (info: { url: string }) => void) => Promise<void> | void
  setInitials: (patch: any) => void
  setTouched: (updater: any) => void
  removeAvatar: (onDone: () => void) => Promise<void> | void
}

export default function AvatarBlock({
  profileImageUrl,
  profileCompletion,
  setAvatarUi,
  uploadAvatar,
  setInitials,
  setTouched,
  removeAvatar,
}: Props) {
  return (
    <ProfilePictureBlock
      imageUrl={profileImageUrl}
      profileCompletion={profileCompletion}
      onImageChange={async (file) => {
        // 1. Preview immédiat
        const preview = URL.createObjectURL(file)
        setAvatarUi(preview)

        // 2. Lancement de l’upload et retour d’une promesse
        return new Promise<string>((resolve) => {
          uploadAvatar(file, ({ url }) => {
            try { URL.revokeObjectURL(preview) } catch {}
            setAvatarUi(url)
            setInitials({ avatar_url: url })
            setTouched((t: any) => ({ ...t, name: t.name }))
            resolve(url) // ✅ Retourne bien une string
          })
        })
      }}
      onImageRemove={async () => {
        if (profileImageUrl?.startsWith('blob:')) {
          try { URL.revokeObjectURL(profileImageUrl) } catch {}
        }
        setAvatarUi('')
        setInitials({ avatar_url: '' })
        await removeAvatar(() => {})
      }}
    />
  )
}
