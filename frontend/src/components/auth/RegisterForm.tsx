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
        <p role="alert" className="error">
          {errors.root.message}
        </p>
      )}

      <div>
        <label htmlFor="email">メールアドレス</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...registerField('email')}
        />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...registerField('password')}
        />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword">パスワード（確認）</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...registerField('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p role="alert">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? '処理中...' : 'アカウントを作成'}
      </button>
    </form>
  )
}
