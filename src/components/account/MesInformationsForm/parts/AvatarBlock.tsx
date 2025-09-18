'use client'
import ProfilePictureBlock from '@/components/account/fields/ProfilePictureBlock'

type Props = {
  profileImageUrl: string
  profileCompletion: number
  setAvatarUi: (url: string) => void
  uploadAvatar: (file: File, onDone: (info: { url: string }) => void) => void
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
      onImageChange={(file) => {
        const preview = URL.createObjectURL(file)
        setAvatarUi(preview)
        uploadAvatar(file, ({ url }) => {
          try { URL.revokeObjectURL(preview) } catch {}
          setAvatarUi(url)
          setInitials({ avatar_url: url })
          setTouched((t: any) => ({ ...t, name: t.name }))
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
