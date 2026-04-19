import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/auth/ProfileForm'
import DeleteAccountButton from '@/components/auth/DeleteAccountButton'
import type { Profile } from '@/types/supabase'

/**
 * FR-009/FR-010: プロフィール管理ページ（Server Component）
 * Middleware が未認証ユーザーを /login にリダイレクトするため、
 * ここに到達するのは認証済みユーザーのみ。
 */
export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // RLS により認証ユーザー自身の行のみ返る
  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .maybeSingle()
  const profile = profileResult.data as Profile | null

  return (
    <main>
      <h1>プロフィール設定</h1>

      {/* FR-009: プロフィール更新フォーム */}
      <section>
        <h2>プロフィール編集</h2>
        <ProfileForm profile={profile} />
      </section>

      {/* FR-010: アカウント削除 */}
      <section>
        <h2>アカウント削除</h2>
        <p>アカウントを削除すると、すべてのデータが削除されます。この操作は取り消せません。</p>
        <DeleteAccountButton />
      </section>
    </main>
  )
}
