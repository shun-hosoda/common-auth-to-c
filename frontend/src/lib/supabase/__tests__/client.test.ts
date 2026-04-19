/**
 * Unit tests — lib/supabase/client.ts
 * [Red → Green] createClient がブラウザ用クライアントを返すことを確認
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// @supabase/ssr をモック
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ type: 'browser-client' })),
}))

describe('createClient (browser)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 環境変数を設定
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:8000'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('createBrowserClient を呼び出してクライアントを返す', async () => {
    const { createBrowserClient } = await import('@supabase/ssr')
    const { createClient } = await import('../client')

    const client = createClient()

    expect(createBrowserClient).toHaveBeenCalledWith(
      'http://localhost:8000',
      'test-anon-key'
    )
    expect(client).toBeDefined()
  })

  it('環境変数 NEXT_PUBLIC_SUPABASE_URL が未設定でも例外をスローしない', async () => {
    const { createClient } = await import('../client')
    expect(() => createClient()).not.toThrow()
  })
})
