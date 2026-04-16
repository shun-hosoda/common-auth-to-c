# 設計ドキュメント要約

> このファイルはトークン効率化のため、全設計書の要約を集約する。
> 各セッションの開始時に全文を読む代わりにこのファイルを参照する。

## 更新日: 2026-04-16

## プロジェクト概要

- **プロダクト**: common-auth-to-c（toC向けSaaS認証基盤）
- **現在のステータス**: 要件定義（Draft）
- **技術スタック**: 未確定（設計工程で決定予定）

## PRD要約 (docs/prd/prd.md)

- **目的**: toC SaaSに共通利用できる認証・認可基盤
- **MVP認証方式**: メール/パスワード + Google OAuth
- **将来拡張**: Apple ID, MFA, パスキー, マジックリンク, マルチテナント
- **主要NFR**: 認証API p95 < 200ms, 可用性 99.9%, bcrypt/argon2id, レート制限

### MVP機能一覧

| ID | 機能 | 優先度 |
|----|------|--------|
| FR-001 | メール/パスワード登録 | Must |
| FR-002 | メール/パスワードログイン | Must |
| FR-003 | メール確認 | Must |
| FR-004 | パスワードリセット | Must |
| FR-005 | Google OAuth | Must |
| FR-006 | Apple ID | Should |
| FR-007 | トークン管理 | Must |
| FR-008 | ログアウト | Must |
| FR-009 | プロフィール管理 | Should |
| FR-010 | アカウント削除 | Should |

## API仕様 (docs/api/openapi.yaml)

- 未定義（テンプレート状態）

## DB設計 (docs/db/schema.sql)

- 未定義（テンプレート状態）

## ADR (docs/adr/)

- なし（テンプレートのみ）

## レビューペルソナ (docs/review/persona.md)

- **ドメイン**: toC向けSaaS認証基盤
- **Chair**: CTO。大規模toC認証基盤の構築・運用経験あり
- **重視点**: ログインUX, スケーラビリティ, セキュリティ（OWASP）, 個人情報保護
