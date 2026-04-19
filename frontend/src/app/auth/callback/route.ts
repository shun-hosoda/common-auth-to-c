import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/home'
  }
  return nextPath
}

/**
 * FR-003/005: OAuth / Email確認 コールバックハンドラ
 * GoTrue からのコールバックを受け取り、セッションをCookieに保存してリダイレクト。
 * openapi.yaml の /auth/callback に対応。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = sanitizeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const redirectTo = type === 'recovery'
        ? `${origin}/reset-password?mode=reset`
        : `${origin}${next}`
      return NextResponse.redirect(redirectTo)
    }
  }

  // エラー時は /login?error=callback_error へリダイレクト
  return NextResponse.redirect(`${origin}/login?error=callback_error`)
}
