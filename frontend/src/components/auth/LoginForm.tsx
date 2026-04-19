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
          {...register('email')}
        />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? '処理中...' : 'ログイン'}
      </button>
    </form>
  )
}
