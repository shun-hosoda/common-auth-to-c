/**
 * Unit tests — middleware.ts
 * [Red → Green] 認証ガードロジック・publicPaths の動作を確認
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// @supabase/ssr をモック
const mockGetUser = vi.fn()
const mockCreateServerClient = vi.fn(() => ({
  auth: { getUser: mockGetUser },
}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

// next/server をモック（NextResponse.redirect はラップ）
vi.mock('next/server', async (importOriginal) => {
  const mod = await importOriginal<typeof import('next/server')>()
  return {
    ...mod,
    NextResponse: {
      ...mod.NextResponse,
      redirect: vi.fn((url: URL) => ({
        type: 'redirect',
        url: url.toString(),
      })),
      next: vi.fn(() => ({
        type: 'next',
        cookies: { getAll: vi.fn(() => []), set: vi.fn() },
      })),
    },
  }
})

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${pathname}`))
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:8000'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('publicPaths — 未認証でもアクセス可能なパス', () => {
    const publicPaths = [
      '/',
      '/login',
      '/register',
      '/verify-email',
      '/reset-password',
      '/auth/callback',
    ]

    it.each(publicPaths)('%s は未認証でもリダイレクトしない', async (pathname) => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const { middleware } = await import('../middleware')
      const req = makeRequest(pathname)
      const res = await middleware(req)

      expect(NextResponse.redirect).not.toHaveBeenCalled()
      expect(res).not.toMatchObject({ type: 'redirect' })
    })
  })

  describe('保護されたパス — 未認証時は /login にリダイレクト', () => {
    const protectedPaths = ['/home', '/profile', '/settings']

    it.each(protectedPaths)('%s は未認証時に /login にリダイレクト', async (pathname) => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const { middleware } = await import('../middleware')
      const req = makeRequest(pathname)
      await middleware(req)

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/login' })
      )
    })
  })

  describe('認証済みユーザー', () => {
    it('保護されたパスへのアクセスはリダイレクトしない', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })
      const { middleware } = await import('../middleware')
      const req = makeRequest('/home')
      await middleware(req)

      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })
})
