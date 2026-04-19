'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  loginSchema,
  registerSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
} from '@/lib/validations/auth'

/** ユーザー向けエラーメッセージのマッピング */
function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません'
  }
  if (message.includes('Email already registered') || message.includes('User already registered')) {
    return 'このメールアドレスはすでに登録されています'
  }
  if (message.includes('Email not confirmed')) {
    return 'メールアドレスの確認が完了していません。確認メールをご確認ください'
  }
  if (message.includes('rate')) {
    return 'しばらく時間をおいてから再試行してください'
  }
  return '予期しないエラーが発生しました。しばらく経ってから再試行してください'
}

function sanitizeRedirectPath(path?: string): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/home'
  }
  return path
}

function getAuthCallbackBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100'
}

/** FR-001: メール/パスワード登録 */
export async function register(input: RegisterInput) {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getAuthCallbackBaseUrl()}/auth/confirm`,
    },
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  // 確認メール送信済み → verify-email ページへ
  redirect('/verify-email')
}

/** FR-002: メール/パスワードログイン */
export async function login(input: LoginInput, redirectTo?: string) {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  redirect(sanitizeRedirectPath(redirectTo))
}

/** FR-008: ログアウト */
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/** FR-004: パスワードリセット申請（メール送信） */
export async function requestPasswordReset(input: ResetPasswordRequestInput) {
  const parsed = resetPasswordRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(':8000', ':3000') ?? 'http://localhost:3000'}/auth/callback?type=recovery`,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  // メール列挙対策: 成功可否に関わらず同じメッセージを返す
  return { success: true }
}

/** FR-004: 新パスワード設定 */
export async function resetPassword(input: ResetPasswordInput) {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  redirect('/login')
}
