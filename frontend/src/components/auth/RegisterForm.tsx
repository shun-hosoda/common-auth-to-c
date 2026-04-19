'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { register } from '@/actions/auth'

/**
 * FR-001: メール/パスワード登録フォーム
 */
export function RegisterForm() {
  const [isPending, startTransition] = useTransition()
  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      const result = await register(data)
      if (result?.error) {
        setError('root', {
          message: typeof result.error === 'string'
            ? result.error
            : '登録に失敗しました',
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
        <label htmlFor="email" className="form-label">メールアドレス</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="form-input"
          aria-invalid={!!errors.email}
          {...registerField('email')}
        />
        {errors.email && <p role="alert" className="form-error">{errors.email.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">パスワード</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="form-input"
          aria-invalid={!!errors.password}
          {...registerField('password')}
        />
        {errors.password && <p role="alert" className="form-error">{errors.password.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">パスワード（確認）</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="form-input"
          aria-invalid={!!errors.confirmPassword}
          {...registerField('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p role="alert" className="form-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" disabled={isPending} aria-busy={isPending} className="btn-primary mt-2">
        {isPending ? '処理中...' : 'アカウントを作成'}
      </button>
    </form>
  )
}
