'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * メール確認後のトークン処理ページ
 * GoTrue が implicit flow でリダイレクトする先。
 * URL hash (#access_token=...) をブラウザ側 Supabase クライアントが自動検出し、
 * セッション Cookie を設定してから /home へ遷移する。
 */
export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // getSession() は URL hash の access_token を自動検出してセッションを確立する
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/home')
      } else {
        // トークンが無効 or 期限切れ → ログインページへ
        router.replace('/login?error=confirm_failed')
      }
    })
  }, [router])

  return (
    <div className="auth-page">
      <div className="auth-card text-center">
        <p className="text-slate-500 text-sm">認証確認中...</p>
      </div>
    </div>
  )
}
