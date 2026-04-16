# ADR-005: Next.js セッション管理方式

## ステータス

提案中

## コンテキスト

ADR-002でSupabase Auth (GoTrue) + Next.js を採用した。
Next.js App Router でのセッション管理（トークンの安全な保存・送信）方式を決定する。

設計会議（2026-04-16）での議論を経て決定。

## 決定

**`@supabase/ssr` パッケージを使用したCookieベースのセッション管理**を採用する。
BFF（Backend for Frontend）の自前実装は行わない。

### 実装パターン

```typescript
// lib/supabase/server.ts（Server Components / Server Actions / Route Handlers）
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// lib/supabase/client.ts（Client Components）
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// middleware.ts（全リクエストで認証状態を更新）
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
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

  // 認証状態を確認（トークン自動リフレッシュ含む）
  const { data: { user } } = await supabase.auth.getUser()

  // 公開ページ（認証不要）
  // ⚠️ Note: Next.js App Router のルートグループ (auth)/(app) はURLパスに現れない。
  //   pathname.startsWith('/(app)') は永久 false になるため使用禁止。
  //   公開パスのポジティブリストで制御する。
  const publicPaths = ['/', '/login', '/register', '/verify-email', '/reset-password', '/auth']
  const isPublicPath = publicPaths.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'))

  // 未認証 + 非公開ページ → /login にリダイレクト
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}
```

### Cookie の特性（`@supabase/ssr` が自動設定）

| 属性 | 値 | 効果 |
|------|-----|------|
| HttpOnly | true | JavaScriptからアクセス不可（XSS対策） |
| Secure | true（本番） | HTTPS通信のみ送信 |
| SameSite | Lax | CSRF対策（Strictだとサードパーティリダイレクトで問題） |
| Path | / | 全パスで送信 |

## 選択肢

### 選択肢A: アクセストークンをlocalStorage/sessionStorageに保存

- **メリット**: SPA的に扱いやすい
- **デメリット**: XSSでトークンが盗まれる。絶対に採用しない

### 選択肢B: BFF (Backend for Frontend) を自前実装

- **メリット**: GoTrueのURLをクライアントに隠蔽できる
- **デメリット**: `@supabase/ssr` が同等のセキュリティを提供するため不要。実装コスト増加のみ

### 選択肢C: `@supabase/ssr` + HttpOnly Cookie ✅ 採用

- **メリット**: Supabase公式推奨。HttpOnly CookieでXSS対策完備。SSRでの認証チェックが容易。トークンリフレッシュを自動処理。実装コスト最小
- **デメリット**: GoTrueのURLとanon keyはクライアントに公開される（設計上意図的なもの。anon keyはRLSで保護される）

## 結果

- `@supabase/ssr` がトークン管理・リフレッシュ・Cookie設定を全て担当
- **XSS対策**: HttpOnly CookieにリフレッシュトークンとJWTを保存
- **CSRF対策**: SameSite=Lax Cookie
- **自動リフレッシュ**: Middlewareとクライアントが協調してトークンを自動更新
- **SSR対応**: Server ComponentsでもCookieからセッションを取得可能
- **`service_role key`は絶対にクライアントに渡さない** （Server Action / Route Handler のみで使用）

## 参考

- Supabase SSR Helpers: https://supabase.com/docs/guides/auth/server-side/nextjs
- @supabase/ssr: https://github.com/supabase/ssr
- 設計会議ログ: docs/design/logs/2026-04-16_000000_auth-mvp.md
- ADR-002: docs/adr/002-technology-stack.md
