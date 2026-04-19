'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OAuthButtonProps {
  provider: 'google'
  redirectTo?: string
  className?: string
}

const PROVIDER_LABELS: Record<OAuthButtonProps['provider'], string> = {
  google: 'Googleでログイン',
}

/**
 * FR-005: Google OAuth ログインボタン
 */
export function OAuthButton({ provider, redirectTo = '/home', className }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        scopes: 'openid email profile',
      },
    })

    if (error) {
      setError('ソーシャルログインに失敗しました。しばらく経ってから再試行してください')
      setIsLoading(false)
    }
    // 成功時はブラウザが OAuth URL へリダイレクトするため setIsLoading(false) 不要
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-busy={isLoading}
        className={className}
      >
        {isLoading ? '処理中...' : PROVIDER_LABELS[provider]}
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  )
}
