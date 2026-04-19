'use client'

import { useState } from 'react'
import { updateProfile } from '@/actions/profile'
import type { Profile } from '@/types/supabase'

type Props = {
  profile: Profile | null
}

/**
 * FR-009: プロフィール更新フォーム（Client Component）
 */
export default function ProfileForm({ profile }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const display_name = formData.get('display_name') as string
    const avatarRaw = formData.get('avatar_url') as string
    const avatar_url = avatarRaw.trim() === '' ? undefined : avatarRaw.trim()

    const result = await updateProfile({ display_name, avatar_url })

    if (result?.error) {
      const errorText =
        typeof result.error === 'string'
          ? result.error
          : Object.values(result.error).flat().join(' ')
      setMessage({ type: 'error', text: errorText })
    } else {
      setMessage({ type: 'success', text: 'プロフィールを更新しました' })
    }

    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="display_name" className="form-label">表示名</label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={profile?.display_name ?? ''}
          maxLength={100}
          disabled={isPending}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="avatar_url" className="form-label">アバター URL</label>
        <input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={profile?.avatar_url ?? ''}
          placeholder="https://example.com/avatar.png"
          disabled={isPending}
          className="form-input"
        />
      </div>

      {message && (
        <p
          role={message.type === 'error' ? 'alert' : 'status'}
          className={message.type === 'error' ? 'form-alert' : 'form-success'}
        >
          {message.text}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary mt-2">
        {isPending ? '更新中...' : '更新する'}
      </button>
    </form>
  )
}
