import { redirect } from 'next/navigation'

/**
 * Root page — 認証状態によってリダイレクト。
 * 実際のリダイレクトは middleware.ts が担当するため、
 * ここには到達しないが念のため /login へ転送する。
 */
export default function RootPage() {
  redirect('/login')
}
