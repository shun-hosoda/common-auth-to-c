import { z } from 'zod'

/** メール/パスワード登録スキーマ */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'メールアドレスを入力してください')
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .max(72, 'パスワードは72文字以下で入力してください'),
    confirmPassword: z
      .string()
      .min(1, 'パスワード（確認）を入力してください'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

/** ログインスキーマ */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

/** パスワードリセット申請スキーマ */
export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
})

/** パスワードリセット（新パスワード設定）スキーマ */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .max(72, 'パスワードは72文字以下で入力してください'),
    confirmPassword: z
      .string()
      .min(1, 'パスワード（確認）を入力してください'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
