# Changelog

All notable changes will be documented in this file.
Format: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

## [1.0.0] - 2026-04-19

### Added
- メール/パスワード登録・ログイン (FR-001, FR-002)
- メールアドレス確認フロー (`/auth/confirm`)
- パスワードリセット
- Google OAuth ログイン
- プロフィール編集・退会
- Tailwind CSS v4 によるスタイリング
- Docker Compose 一括起動 (GoTrue + Kong + PostgREST + Inbucket + Next.js)
- GitHub Actions による ghcr.io への自動イメージ配布ワークフロー

### Fixed
- Kong keyauth: `${SUPABASE_ANON_KEY}` プレースホルダー未展開問題
- GoTrue migration 20221208132122 uuid=text 型不一致エラー
- `supabase_auth_admin` の search_path 未設定によるテーブル参照エラー
- メール確認リンクの `no Route matched` エラー (Kong `/verify` ルート追加)
- Tailwind v4 で `@apply` カスタムクラス参照不可 (インライン展開へ変更)
