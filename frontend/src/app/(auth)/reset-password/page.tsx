import Link from 'next/link'
import {
  PasswordResetRequestForm,
  PasswordResetForm,
} from '@/components/auth/PasswordResetForm'

interface ResetPasswordPageProps {
  searchParams: Promise<{ mode?: string }>
}

/**
 * FR-004: パスワードリセットページ
 * ?mode=reset のとき新パスワード設定フォームを表示（OAuthコールバック後）
 * それ以外はメール送信フォームを表示
 */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { mode } = await searchParams
  const isResetMode = mode === 'reset'

  return (
    <div className="auth-page">
      <main className="auth-card">
        <h1 className="auth-title">
          {isResetMode ? '新しいパスワードを設定' : 'パスワードをリセット'}
        </h1>

        {isResetMode ? <PasswordResetForm /> : <PasswordResetRequestForm />}

        <nav className="auth-nav">
          <Link href="/login" className="auth-link">← ログインページへ戻る</Link>
        </nav>
      </main>
    </div>
  )
}
