/**
 * Unit tests — actions/auth.ts
 * [Red → Green] Server Actions の認証ロジックを確認
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// next/navigation をモック
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// lib/supabase/server をモック
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}))

describe('register action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('signUp を正しい引数で呼び出す', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: '1' } }, error: null })
    const { register } = await import('../auth')

    await register({ email: 'user@example.com', password: 'password123', confirmPassword: 'password123' })

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      },
    })
  })

  it('バリデーションエラーの場合は signUp を呼ばない', async () => {
    const { register } = await import('../auth')
    const result = await register({ email: 'bad', password: 'short', confirmPassword: 'short' })

    expect(mockSignUp).not.toHaveBeenCalled()
    expect(result?.error).toBeDefined()
  })

  it('Supabase エラーが発生した場合はエラーを返す', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' },
    })
    const { register } = await import('../auth')
    const result = await register({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })

    expect(result?.error).toBeDefined()
  })
})

describe('login action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('signInWithPassword を正しい引数で呼び出し /home へリダイレクト', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: '1' } },
      error: null,
    })
    const { login } = await import('../auth')
    await login({ email: 'user@example.com', password: 'password123' })

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(mockRedirect).toHaveBeenCalledWith('/home')
  })

  it('認証エラーの場合はエラーメッセージを返す', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })
    const { login } = await import('../auth')
    const result = await login({ email: 'user@example.com', password: 'wrong' })

    expect(result?.error).toBe('メールアドレスまたはパスワードが正しくありません')
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})

describe('logout action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('signOut を呼び出し /login へリダイレクト', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    const { logout } = await import('../auth')
    await logout()

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
