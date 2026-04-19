/**
 * Unit tests — lib/supabase/admin.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// @supabase/supabase-js をモック（実際の HTTP 接続を避ける）
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { admin: {} } })),
}))

describe('createAdminClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('両方の環境変数が揃っている場合はクライアントを返す', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:8000'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

    const { createAdminClient } = await import('../admin')
    const client = createAdminClient()

    expect(client).toBeDefined()
  })

  it('NEXT_PUBLIC_SUPABASE_URL が未設定の場合は例外を投げる', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

    const { createAdminClient } = await import('../admin')

    expect(() => createAdminClient()).toThrow('NEXT_PUBLIC_SUPABASE_URL が設定されていません')
  })

  it('SUPABASE_SERVICE_ROLE_KEY が未設定の場合は例外を投げる', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:8000'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const { createAdminClient } = await import('../admin')

    expect(() => createAdminClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY が設定されていません')
  })
})

describe('getAdminClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('初回呼び出しでクライアントを生成して返す', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:8000'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

    const { getAdminClient } = await import('../admin')
    const client = getAdminClient()

    expect(client).toBeDefined()
  })

  it('2回呼び出しても同じインスタンスを返す（シングルトン）', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:8000'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

    const { getAdminClient } = await import('../admin')
    const client1 = getAdminClient()
    const client2 = getAdminClient()

    expect(client1).toBe(client2)
  })
})
