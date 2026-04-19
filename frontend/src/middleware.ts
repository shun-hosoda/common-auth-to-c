import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 公開パス一覧（認証不要）
 *
 * ⚠️ Next.js App Router のルートグループ (auth)/(app) はURLパスに現れない。
 *    pathname.startsWith('/(app)') は永久 false になるため使用禁止。
 *    公開パスのポジティブリストで制御する（ADR-005参照）。
 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/reset-password',
]

/** /auth/* パスは GoTrue コールバック含めすべて公開 */
function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/auth/')) return true
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 認証状態を確認（アクセストークンの自動リフレッシュも実行）
  // NOTE: getSession() ではなく getUser() を使う（セキュリティ上の理由）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 未認証 + 非公開パス → /login にリダイレクト
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = new URL('/login', request.url)
    // リダイレクト後に元のURLへ戻れるよう next パラメータを付与
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除外してマッチさせる:
     * - _next/static (静的ファイル)
     * - _next/image  (画像最適化)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
}
