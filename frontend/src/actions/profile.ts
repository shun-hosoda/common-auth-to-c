'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from '@/lib/validations/profile'
import type { ProfileUpdate } from '@/types/supabase'

/**
 * FR-009: プロフィール更新
 * 認証済みユーザーが display_name / avatar_url を更新する。
 */
export async function updateProfile(input: ProfileUpdateInput) {
  const parsed = profileUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: '認証が必要です' }
  }

  // undefined のフィールドは DB に送らない（省略したフィールドを上書きしない）
  const updateData: ProfileUpdate = {}
  if (parsed.data.display_name !== undefined) {
    updateData.display_name = parsed.data.display_name
  }
  if ('avatar_url' in parsed.data) {
    updateData.avatar_url = parsed.data.avatar_url ?? null
  }

  // NOTE: @supabase/supabase-js の型定義で .update() が never を返すことがある既知の問題
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return { error: 'プロフィールの更新に失敗しました' }
  }

  return { success: true }
}

/**
 * FR-010: アカウント削除（退会）
 * signOut → admin.deleteUser（CASCADE で profiles も削除）→ /login へリダイレクト
 */
export async function deleteAccount() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: '認証が必要です' }
  }

  // 先にセッションを破棄
  await supabase.auth.signOut()

  // service_role で auth.users を削除（ON DELETE CASCADE により profiles も削除される）
  const { error } = await getAdminClient().auth.admin.deleteUser(user.id)

  if (error) {
    return { error: 'アカウントの削除に失敗しました' }
  }

  redirect('/login')
}
