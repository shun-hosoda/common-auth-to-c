/**
 * Unit tests — actions/profile.ts
 * [Red → Green] Server Actions のプロフィール管理ロジックを確認
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// next/navigation をモック
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// lib/supabase/server をモック
const mockGetUser = vi.fn()
const mockSignOut = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
    from: mockFrom,
  })),
}))

// lib/supabase/admin をモック
const mockDeleteUser = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
  })),
}))

// --- updateProfile ---
describe('updateProfile action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('バリデーションエラーの場合は DB を呼ばない', async () => {
    const { updateProfile } = await import('../profile')
    const result = await updateProfile({ display_name: 'a'.repeat(101) })

    expect(result?.error).toBeDefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('未認証の場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { updateProfile } = await import('../profile')

    const result = await updateProfile({ display_name: '新しい名前' })

    expect(result?.error).toBe('認証が必要です')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('正常に更新できる場合は success を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const { updateProfile } = await import('../profile')
    const result = await updateProfile({ display_name: '新しい名前' })

    expect(result?.success).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('Supabase エラーが発生した場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
    })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const { updateProfile } = await import('../profile')
    const result = await updateProfile({ display_name: '名前' })

    expect(result?.error).toBe('プロフィールの更新に失敗しました')
  })
})

// --- deleteAccount ---
describe('deleteAccount action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未認証の場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { deleteAccount } = await import('../profile')

    const result = await deleteAccount()

    expect(result?.error).toBe('認証が必要です')
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('正常削除: signOut → deleteUser → /login にリダイレクト', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSignOut.mockResolvedValue({})
    mockDeleteUser.mockResolvedValue({ error: null })

    const { deleteAccount } = await import('../profile')
    await deleteAccount()

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockDeleteUser).toHaveBeenCalledWith('user-1')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('deleteUser がエラーの場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSignOut.mockResolvedValue({})
    mockDeleteUser.mockResolvedValue({ error: { message: 'delete failed' } })

    const { deleteAccount } = await import('../profile')
    const result = await deleteAccount()

    expect(result?.error).toBe('アカウントの削除に失敗しました')
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
