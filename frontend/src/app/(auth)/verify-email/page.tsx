import Link from 'next/link'

/**
 * FR-003: メール確認待ちページ
 * 登録後・メールアドレス変更後に表示される。
 */
export default function VerifyEmailPage() {
  return (
    <div className="auth-page">
      <main className="auth-card text-center">
        <div className="mb-4 text-4xl">📧</div>
        <h1 className="auth-title">メールを確認してください</h1>
        <p className="text-sm text-slate-600 mb-2">
          登録したメールアドレスに確認メールを送信しました。
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <p className="text-sm text-slate-500 mb-6">
          メールが届かない場合は迷惑メールフォルダをご確認ください。
        </p>
        <nav>
          <Link href="/login" className="auth-link text-sm">← ログインページへ戻る</Link>
        </nav>
      </main>
    </div>
  )
}
