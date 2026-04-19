'use client'

import { useState } from 'react'
import { deleteAccount } from '@/actions/profile'

/**
 * FR-010: アカウント削除ボタン（確認ダイアログ付き、Client Component）
 */
export default function DeleteAccountButton() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    const confirmed = window.confirm(
      '本当にアカウントを削除しますか？\nこの操作は取り消せません。'
    )
    if (!confirmed) return

    setIsPending(true)
    setError(null)

    const result = await deleteAccount()

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
    // 成功時は Server Action 内で /login へリダイレクトされる
  }

  return (
    <div>
      {error && <p role="alert" className="form-alert">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-danger max-w-xs"
      >
        {isPending ? '処理中...' : '退会する'}
      </button>
    </div>
  )
}
