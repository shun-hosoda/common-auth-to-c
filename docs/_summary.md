# 設計ドキュメント要約

> このファイルはトークン効率化のため、全設計書の要約を集約する。
> 各セッションの開始時に全文を読む代わりにこのファイルを参照する。

## 更新日: 2026-04-16

## プロジェクト概要

- **プロダクト**: common-auth-to-c（toC向けSaaS認証基盤）
- **現在のステータス**: 設計完了 → 設計レビュー待ち
- **技術スタック**: Supabase Auth (OSS) + Next.js 15 + PostgreSQL + Redis（ADR-002で決定）

## PRD要約 (docs/prd/prd.md)

- **目的**: toC SaaSに共通利用できる認証・認可基盤
- **MVP認証方式**: メール/パスワード + Google OAuth（Apple IDはPhase 2）
- **将来拡張**: Apple ID, MFA, パスキー, マジックリンク, マルチテナント
- **主要NFR**: 認証API p95 < 200ms, 可用性 99.9%, bcrypt (GoTrue管理), レート制限

### MVP機能一覧

| ID | 機能 | 優先度 |
|----|------|--------|
| FR-001 | メール/パスワード登録 | Must |
| FR-002 | メール/パスワードログイン | Must |
| FR-003 | メール確認（必須化） | Must |
| FR-004 | パスワードリセット | Must |
| FR-005 | Google OAuth | Must |
| FR-007 | トークン管理（GoTrueに委譲） | Must |
| FR-008 | ログアウト | Must |
| FR-009 | プロフィール管理 | Should |
| FR-010 | アカウント削除（ソフトデリートのみ Phase 1） | Should |

## API仕様 (docs/api/openapi.yaml)

- GoTrueエンドポイントと Next.js カスタムRouteを定義済み

## DB設計 (docs/db/schema.sql)

- `public.profiles` （1テーブル）+ RLS + 自動生成トリガー 定義済み
- GoTrue管理テーブル（`auth.*`）は変更禁止

## ADR (docs/adr/)

| ADR | タイトル | ステータス | 決定 |
|-----|---------|----------|------|
| 001 | システムアーキテクチャ | 提案中 | **Supabase Auth (OSS)** + Next.js。GoTrueが認証コア |
| 002 | 技術スタック | 提案中 | **Supabase Auth (OSS セルフホスト)** + Next.js + PostgreSQL + Redis |
| 003 | 認証・トークン戦略 | 提案中 | GoTrue標準採用（JWT RS256 Access 15分 + Opaque Refresh）+ bcrypt |
| 004 | データアーキテクチャ | 提案中 | auth.*はGoTrue管理、public.profilesのみ自前 + RLS |
| 005 | Next.jsセッション管理 | 提案中 | `@supabase/ssr` + HttpOnly Cookie。BFF自前実装不要 |

## 設計会議ログ (docs/design/logs/)

- `2026-04-16_000000_auth-mvp.md` — MVP認証フロー・ルート構成・GoTrue設定の設計決定

## レビューペルソナ (docs/review/persona.md)

- **ドメイン**: toC向けSaaS認証基盤
- **Chair**: CTO。大規模toC認証基盤の構築・運用経験あり
- **重視点**: ログインUX, スケーラビリティ, セキュリティ（OWASP）, 個人情報保護
