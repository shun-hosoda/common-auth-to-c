import Link from 'next/link'

/**
 * FR-003: メール確認待ちページ
 * 登録後・メールアドレス変更後に表示される。
 */
export default function VerifyEmailPage() {
  return (
    <main>
      <h1>メールアドレスの確認</h1>
      <p>
        登録したメールアドレスに確認メールを送信しました。
        <br />
        メール内のリンクをクリックして登録を完了してください。
      </p>
      <p>
        メールが届かない場合は迷惑メールフォルダをご確認ください。
      </p>
      <nav>
        <Link href="/login">ログインページへ戻る</Link>
      </nav>
    </main>
  )
}
