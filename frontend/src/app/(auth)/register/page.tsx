import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { OAuthButton } from '@/components/auth/OAuthButton'

/**
 * FR-001: ユーザー登録ページ
 */
export default function RegisterPage() {
  return (
    <div className="auth-page">
      <main className="auth-card">
        <h1 className="auth-title">アカウントを作成</h1>

        <OAuthButton provider="google" />

        <div className="divider">
          <span className="divider-text">または</span>
        </div>

        <RegisterForm />

        <nav className="auth-nav">
          <p>
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="auth-link">こちら</Link>
          </p>
        </nav>
      </main>
    </div>
  )
}
