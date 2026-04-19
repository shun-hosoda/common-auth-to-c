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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">ホーム</h1>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-slate-700">
            ようこそ、<span className="font-medium text-slate-900">{profile?.display_name ?? user?.email}</span> さん
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <a
              href="/profile"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
            >
              プロフィールを編集 →
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
