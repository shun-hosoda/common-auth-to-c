'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { login } from '@/actions/auth'

interface LoginFormProps {
  redirectTo?: string
}

/**
 * FR-002: メール/パスワードログインフォーム
 */
export function LoginForm({ redirectTo }: LoginFormProps) {
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await login(data, redirectTo)
      if (result?.error) {
        setError('root', {
          message: typeof result.error === 'string'
            ? result.error
            : 'ログインに失敗しました',
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
          {...register('email')}
        />
        {errors.email && <p role="alert" className="form-error">{errors.email.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">パスワード</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="form-input"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && <p role="alert" className="form-error">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isPending} aria-busy={isPending} className="btn-primary mt-2">
        {isPending ? '処理中...' : 'ログイン'}
      </button>
    </form>
  )
}
