import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { OAuthButton } from '@/components/auth/OAuthButton'

/**
 * FR-001: ユーザー登録ページ
 */
export default function RegisterPage() {
  return (
    <main>
      <h1>アカウントを作成</h1>

      <OAuthButton provider="google" />

      <hr />

      <RegisterForm />

      <nav>
        <Link href="/login">すでにアカウントをお持ちの方</Link>
      </nav>
    </main>
  )
}
