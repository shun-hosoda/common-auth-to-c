/**
 * Unit tests — lib/validations/auth.ts
 * [Red → Green] Zod スキーマのバリデーション動作を確認
 */
import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
} from '../auth'

describe('registerSchema', () => {
  it('有効なデータはパスする', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('パスワードが8文字未満はエラー', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined()
    }
  })

  it('パスワードが一致しない場合はエラー', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    })
    expect(result.success).toBe(false)
  })

  it('不正なメールアドレスはエラー', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined()
    }
  })
})

describe('loginSchema', () => {
  it('有効なデータはパスする', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('メールアドレスが空はエラー', () => {
    const result = loginSchema.safeParse({ email: '', password: 'pass' })
    expect(result.success).toBe(false)
  })

  it('パスワードが空はエラー', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordRequestSchema', () => {
  it('有効なメールアドレスはパスする', () => {
    const result = resetPasswordRequestSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })
})
