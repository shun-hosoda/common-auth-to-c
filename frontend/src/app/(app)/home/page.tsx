import { createClient } from '@/lib/supabase/server'
import { logout } from '@/actions/auth'
import type { Profile } from '@/types/supabase'

/**
 * FR-008 (ログアウト) + 認証済みホームページ
 * Middleware が未認証ユーザーを /login にリダイレクトするため、
 * ここに到達するのは認証済みユーザーのみ。
 */
export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // public.profiles からプロフィールを取得（RLS で認証ユーザーの行のみ返る）
  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .maybeSingle()
  const profile = profileResult.data as Profile | null

  return (
    <main>
      <h1>ホーム</h1>
      <p>ようこそ、{profile?.display_name ?? user?.email} さん</p>

      {/* FR-008: ログアウト */}
      <form action={logout}>
        <button type="submit">ログアウト</button>
      </form>
    </main>
  )
}
