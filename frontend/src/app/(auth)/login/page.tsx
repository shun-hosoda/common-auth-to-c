import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { OAuthButton } from '@/components/auth/OAuthButton'

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>
}

/**
 * FR-002: ログインページ
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams

  return (
    <main>
      <h1>ログイン</h1>

      {error === 'callback_error' && (
        <p role="alert">
          認証に失敗しました。もう一度お試しください。
        </p>
      )}

      <OAuthButton provider="google" redirectTo={next ?? '/home'} />

      <hr />

      <LoginForm redirectTo={next} />

      <nav>
        <Link href="/register">アカウントを作成</Link>
        <Link href="/reset-password">パスワードを忘れた方</Link>
      </nav>
    </main>
  )
}
