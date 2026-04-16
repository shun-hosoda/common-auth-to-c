# プロジェクトコンテキスト

## プロダクト概要

| 項目 | 内容 |
|------|------|
| プロダクト名 | common-auth-to-c |
| 種別 | toC向けSaaS認証基盤 |
| 目的 | 一般消費者向けSaaSサービスに共通利用できる認証・認可基盤の構築 |
| ステータス | 要件定義前（初期セットアップ完了） |

## 認証方式（予定）

- メール/パスワード認証（MVP）
- ソーシャルログイン（Google, Apple等）（MVP）
- ※ 追加認証方式（MFA, パスキー等）は要件定義で決定

## 技術スタック

| レイヤー | 技術 | 備考 |
|----------|------|------|
| 認証基盤 | **Supabase Auth (GoTrue / OSS)** | セルフホスト。JWT・OAuth・メール確認を内蔵 |
| フロントエンド | **Next.js 15 / TypeScript** | frontend/src/ |
| データベース | **PostgreSQL 16** | Supabase内蔵。`auth.*` + `public.*` |
| キャッシュ | **Redis 7** | レート制限補完用 |
| インフラ | **Docker + Docker Compose** | どのクラウドでもデプロイ可能（クラウド非依存） |
| リバースプロキシ | **Nginx** or **Traefik** | TLS・レート制限 |
| CI/CD | **GitHub Actions** | .github/workflows/ |

## ディレクトリ構成

```
common-auth-to-c/
├── backend/src/          # バックエンドアプリケーション
│   ├── api/              # APIルーティング・コントローラー
│   ├── models/           # データモデル・スキーマ定義
│   └── services/         # ビジネスロジック
├── frontend/src/         # フロントエンドアプリケーション
│   ├── app/              # ページ・ルーティング
│   ├── components/       # UIコンポーネント
│   └── hooks/            # カスタムフック
├── docs/                 # 設計ドキュメント（Single Source of Truth）
│   ├── prd/              # プロダクト要件定義
│   ├── adr/              # アーキテクチャ決定記録
│   ├── api/              # API仕様（OpenAPI）
│   ├── db/               # DB設計（schema.sql）
│   ├── design/           # 設計書
│   ├── implementation/   # 実装計画
│   └── review/           # レビュー設定・ログ
├── tests/                # テスト
│   ├── unit/             # 単体テスト
│   ├── integration/      # 統合テスト
│   └── e2e/              # E2Eテスト
├── infra/                # インフラ設定
│   └── docker/           # Docker関連
├── scripts/              # ユーティリティスクリプト
└── .ai-project/          # AI開発設定（このディレクトリ）
```

## 開発規約

- 文字コード: UTF-8
- 改行コード: LF
- インデント: スペース（2スペース、Python系は4スペース）
- コミット: Conventional Commits 準拠
- ブランチ: main / develop / feature/<id>-<desc>
- コードコメント: 英語
- ドキュメント: 日本語

## 関連リソース

- 設計ドキュメント正: `docs/` 配下
- DB設計正: `docs/db/schema.sql`
- API仕様正: `docs/api/openapi.yaml`
