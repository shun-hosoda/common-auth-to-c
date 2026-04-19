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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/home" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            ← 戻る
          </a>
          <h1 className="text-lg font-semibold text-slate-900">プロフィール設定</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* FR-009: プロフィール更新フォーム */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">プロフィール編集</h2>
          <ProfileForm profile={profile} />
        </section>

        {/* FR-010: アカウント削除 */}
        <section className="bg-white rounded-xl border border-red-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-red-700 mb-2">アカウント削除</h2>
          <p className="text-sm text-slate-500 mb-4">
            アカウントを削除すると、すべてのデータが削除されます。この操作は取り消せません。
          </p>
          <DeleteAccountButton />
        </section>
      </main>
    </div>
  )
}
