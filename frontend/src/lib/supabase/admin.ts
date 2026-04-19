/**
 * Supabase Admin クライアント（service_role キー使用）
 *
 * ⚠️ サーバーサイド専用: Server Actions / API Routes のみからインポートすること。
 * ⚠️ Client Components・ブラウザバンドルには絶対に含めないこと。
 * ⚠️ SUPABASE_SERVICE_ROLE_KEY は NEXT_PUBLIC_ 禁止。
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * service_role クライアントを生成して返す。
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('[admin] NEXT_PUBLIC_SUPABASE_URL が設定されていません')
  }
  if (!serviceRoleKey) {
    throw new Error('[admin] SUPABASE_SERVICE_ROLE_KEY が設定されていません')
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

type AdminClient = ReturnType<typeof createAdminClient>
let _client: AdminClient | null = null

/**
 * 遅延シングルトン: 初回呼び出し時にクライアントを生成してキャッシュする。
 * モジュールロード時には生成しない（テスト容易性・SSR 起動時のエラー回避）。
 */
export function getAdminClient(): AdminClient {
  if (!_client) {
    _client = createAdminClient()
  }
  return _client
}
