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
    <div className="auth-page">
      <main className="auth-card">
        <h1 className="auth-title">ログイン</h1>

        {error === 'callback_error' && (
          <p role="alert" className="form-alert">
            認証に失敗しました。もう一度お試しください。
          </p>
        )}

        <OAuthButton provider="google" redirectTo={next ?? '/home'} />

        <div className="divider">
          <span className="divider-text">または</span>
        </div>

        <LoginForm redirectTo={next} />

        <nav className="auth-nav space-y-2">
          <p>
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="auth-link">こちら</Link>
          </p>
          <p>
            <Link href="/reset-password" className="auth-link">パスワードを忘れた方</Link>
          </p>
        </nav>
      </main>
    </div>
  )
}
