'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Camera, User } from 'lucide-react'
import { updateProfileName, updateAvatarUrl } from '@/app/dashboard/actions'
import { createClient } from '@/lib/supabase/client'
import { getInitials, getAvatarBgClass } from '@/lib/utils'

interface Props {
  userId: string
  fullName: string | null
  avatarUrl: string | null
}

export default function ProfileSettings({ userId, fullName, avatarUrl }: Props) {
  const [name, setName] = useState(fullName ?? '')
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('full_name', name)
      const result = await updateProfileName(null, fd)
      if (!result?.error) {
        setNameSaved(true)
        setTimeout(() => setNameSaved(false), 2000)
      }
    })
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5 MB')
      return
    }

    setUploadProgress(true)
    setUploadError(null)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      await updateAvatarUrl(publicUrl)
      setCurrentAvatar(publicUrl)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadProgress(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-slate-500" />
        <h2 className="text-lg font-semibold text-slate-700">Profile</h2>
      </div>

      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-20 h-20">
            {currentAvatar ? (
              <Image
                src={currentAvatar}
                alt={name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${getAvatarBgClass(name)}`}>
                {getInitials(name)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadProgress}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress}
            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer disabled:opacity-50"
          >
            {uploadProgress ? 'Uploading…' : 'Change photo'}
          </button>
          {uploadError && <p className="text-xs text-red-500 text-center max-w-[120px]">{uploadError}</p>}
        </div>

        {/* Name form */}
        <form onSubmit={handleNameSubmit} className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Your full name"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
          />
          <button
            type="submit"
            disabled={isPending || name === (fullName ?? '')}
            className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isPending ? 'Saving…' : nameSaved ? '✓ Saved' : 'Save name'}
          </button>
        </form>
      </div>
    </div>
  )
}
