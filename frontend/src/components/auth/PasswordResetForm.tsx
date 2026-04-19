'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition, useState } from 'react'
import {
  resetPasswordRequestSchema,
  resetPasswordSchema,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
} from '@/lib/validations/auth'
import { requestPasswordReset, resetPassword } from '@/actions/auth'

/**
 * FR-004: パスワードリセット申請フォーム（メール送信）
 */
export function PasswordResetRequestForm() {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
  })

  const onSubmit = (data: ResetPasswordRequestInput) => {
    startTransition(async () => {
      await requestPasswordReset(data)
      // メール列挙対策: エラーが返っても成功と同じメッセージを表示
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <p className="text-sm text-slate-600 p-4 bg-green-50 border border-green-200 rounded-lg">
        パスワードリセットのメールを送信しました。メールボックスをご確認ください。
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {errors.root && (
        <p role="alert" className="form-alert">
          {errors.root.message}
        </p>
      )}

      <div className="form-group">
        <label htmlFor="email" className="form-label">メールアドレス</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="form-input"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <p role="alert" className="form-error">{errors.email.message}</p>}
      </div>

      <button type="submit" disabled={isPending} aria-busy={isPending} className="btn-primary mt-2">
        {isPending ? '送信中...' : 'リセットメールを送信'}
      </button>
    </form>
  )
}

/**
 * FR-004: 新パスワード設定フォーム（コールバック後）
 */
export function PasswordResetForm() {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = (data: ResetPasswordInput) => {
    startTransition(async () => {
      const result = await resetPassword(data)
      if (result?.error) {
        setError('root', {
          message: typeof result.error === 'string'
            ? result.error
            : 'パスワードのリセットに失敗しました',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {errors.root && (
        <p role="alert" className="form-alert">
          {errors.root.message}
        </p>
      )}

      <div className="form-group">
        <label htmlFor="password" className="form-label">新しいパスワード</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="form-input"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && <p role="alert" className="form-error">{errors.password.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">新しいパスワード（確認）</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="form-input"
          aria-invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p role="alert" className="form-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" disabled={isPending} aria-busy={isPending} className="btn-primary mt-2">
        {isPending ? '変更中...' : 'パスワードを変更する'}
      </button>
    </form>
  )
}
