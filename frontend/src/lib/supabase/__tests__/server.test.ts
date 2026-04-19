/**
 * Unit tests — lib/supabase/server.ts
 * [Red → Green] createClient がサーバー用クライアントを返すことを確認
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// next/headers をモック
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: vi.fn(() => []),
      set: vi.fn(),
    })
  ),
}))

// @supabase/ssr をモック
const mockCreateServerClient = vi.fn(() => ({ type: 'server-client' }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

describe('createClient (server)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:8000'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('createServerClient を正しい引数で呼び出す', async () => {
    const { createClient } = await import('../server')
    const client = await createClient()

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'http://localhost:8000',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    )
    expect(client).toBeDefined()
  })

  it('cookies().getAll を通じてCookieを読み取れる', async () => {
    const { cookies } = await import('next/headers')
    const mockCookieStore = {
      getAll: vi.fn(() => [{ name: 'sb-auth', value: 'token' }]),
      set: vi.fn(),
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never)

    const { createClient } = await import('../server')
    await createClient()

    // createServerClient に渡された cookies.getAll を呼び出し
    const callArgs = mockCreateServerClient.mock.calls[0] as unknown[]
    const cookieHandlers = (callArgs?.[2] as { cookies?: { getAll?: () => unknown } })?.cookies
    if (cookieHandlers?.getAll) {
      const result = cookieHandlers.getAll()
      expect(result).toEqual([{ name: 'sb-auth', value: 'token' }])
    }
  })
})
