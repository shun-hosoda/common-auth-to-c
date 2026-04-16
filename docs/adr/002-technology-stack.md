# ADR-002: 技術スタック選定（認証基盤の自前実装 vs OSS活用）

## ステータス

提案中

## コンテキスト

ADR-001でモジュラーモノリス + クリーンアーキテクチャを採用した。
認証基盤を「自前実装」するか「OSS認証ソリューションを活用」するかを含め、技術スタックを決定する。

制約:
- **クラウド非依存**: 特定クラウドサービスに依存しない（ただしOSSはOK）
- **コンテナベース**: Docker でどこでもデプロイ可能
- **認証特化**: セキュリティライブラリの品質が重要
- **MVP速度**: Phase 1を迅速に立ち上げられること

## OSS認証ソリューションの比較

認証機能をゼロから作る前に、既存OSSの活用を検討する。
これらはすべて**無料・オープンソース・セルフホスト可能**。

| ソリューション | 言語 | 特徴 | 向いている場面 | 課題 |
|--------------|------|------|--------------|------|
| **Supabase** | TypeScript/Go | PostgreSQL + Auth + Storage + Realtime の統合基盤。OSSでセルフホスト可 | フルスタックSaaSを素早く立ち上げたい | 認証以外の機能も抱える（マイクロサービス分割に不向き） |
| **Keycloak** | Java | エンタープライズ向け IdP。OIDC/SAML/RBAC完全対応 | 企業向け・複雑な権限管理が必要 | 重量級。コンシューマ向けUXのカスタマイズが難しい |
| **Authentik** | Python | モダンな IdP。Docker一発で起動。UI が比較的きれい | 中規模〜大規模。LDAP/SAML連携も必要な場合 | toC向けのシンプルなログインUXには過剰な機能が多い |
| **Ory Kratos** | Go | ヘッドレス IDM。UI は自前で実装。軽量・API-first | フロントエンドを完全にコントロールしたい場合 | UIが一切ないため実装量はほぼ自前と同等。学習コスト高 |
| **Zitadel** | Go | クラウドネイティブ IAM。マルチテナント内蔵 | マルチテナントが最初から必要 | オーバースペック。toC MVP には重い |
| **自前実装 (FastAPI)** | Python | 完全カスタム | 認証フローを完全制御したい。学習・PoC目的 | セキュリティの担保を全て自前で行う必要あり |

## 決定

**Supabase（OSSセルフホスト）をベースとして採用し、フロントエンドを Next.js で自前実装する。**

### 理由

1. **無料・オープンソース**: MITライセンス。Supabase Cloud（有料）を使わずとも、Docker Composeで完全セルフホスト可能
2. **クラウド非依存**: どのVPS・クラウドでも `docker compose up` で起動。将来Supabase Cloudに移行することも可能（バイアウトの心配なし）
3. **認証が包括的**: メール/パスワード・Google OAuth・メール確認・パスワードリセット・JWTトークン発行がすべて組み込み済み
4. **PostgreSQL統合**: DB（PostgreSQL）と認証が同一スタックで管理でき、Row Level Security(RLS)との連携が容易
5. **MVP速度**: 認証ロジックをゼロから実装せず、セキュリティ品質が保証されたGoTrue（Supabase Auth）をそのまま利用できる
6. **将来拡張**: MFA・マジックリンク等もSupabase Auth側で対応済み

### アーキテクチャ構成

```
┌─────────────────────────────────────────────────────┐
│                    Clients                          │
│          (Next.js SPA / Mobile / 外部SaaS)          │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Reverse Proxy (Nginx/Traefik)           │
│         TLS終端 / レート制限 / CORS                  │
└─────┬────────────────────────────────┬──────────────┘
      │ /auth/*                        │ /api/*
┌─────▼──────────────────┐    ┌────────▼───────────────┐
│   Supabase Auth        │    │  アプリケーション API   │
│   (GoTrue / OSS)       │    │  (Next.js API Routes   │
│   ────────────────     │    │   or 別途 FastAPI)      │
│   - メール/PWログイン  │    │   JWT検証のみ実行       │
│   - Google OAuth       │    └────────────────────────┘
│   - JWT発行・検証      │
│   - メール確認         │
│   - PW リセット        │
└─────┬──────────────────┘
      │
┌─────▼──────────────────┐    ┌────────────────────────┐
│   PostgreSQL 16        │    │   Redis 7              │
│   (Supabase内蔵)       │    │   (レート制限補完用)    │
│   - auth.users         │    └────────────────────────┘
│   - auth.sessions      │
│   - auth.identities    │
│   - アプリ固有テーブル  │
└────────────────────────┘
```

### 技術スタック

| レイヤー | 技術 | 備考 |
|----------|------|------|
| 認証基盤 | **Supabase Auth (GoTrue)** | OSSセルフホスト。JWT(RS256)発行・管理 |
| フロントエンド | **Next.js 15 / TypeScript** | Supabase JS SDK でAuth連携 |
| データベース | **PostgreSQL 16** | Supabase内蔵。アプリテーブルも同居 |
| キャッシュ | **Redis 7** | レート制限補完・高速KV（Supabase非内蔵機能のみ） |
| インフラ | **Docker + Docker Compose** | どのクラウドでもデプロイ可能 |
| リバースプロキシ | **Nginx** or **Traefik** | TLS・レート制限 |
| CI/CD | **GitHub Actions** | |
| リンター | **ESLint + Prettier (TS), Ruff (Python)** | |

## 選択肢詳細

### 選択肢A: Supabase OSS セルフホスト ✅ 採用

- **メリット**: 無料。セルフホストでクラウド非依存。認証機能が完備。PostgreSQL統合でDBと認証が一元管理。公式SDKが充実（supabase-js, supabase-flutter等）
- **デメリット**: Supabase独自のスキーマ（`auth.*`）がある程度固定。Supabase以外への認証移行コストはやや高い。GoTrueの内部コードを改修するとアップデートが困難

### 選択肢B: Ory Kratos（ヘッドレスIDM）

- **メリット**: Go製で軽量。API-firstで完全カスタマイズ可能
- **デメリット**: UIが一切ないため自前実装量が多い。学習コストが高い。選択肢Aと開発量がほぼ同等

### 選択肢C: FastAPI 自前実装

- **メリット**: 完全にビジネスロジックを制御できる。学習・PoC目的に最適
- **デメリット**: argon2id実装・JWT管理・OAuth・レート制限など全てのセキュリティを自前保証する必要あり。開発コストが最大

### 選択肢D: Keycloak / Authentik

- **メリット**: 非常に成熟。エンタープライズ機能豊富
- **デメリット**: toC向けのシンプルなログインUXに対して過剰。初期の重さと複雑性がMVP速度を損なう

## 結果

- **Supabase Auth (OSS)** を認証コアとして採用し、認証ロジックの自前実装を最小化
- フロントエンドは **Next.js + supabase-js** で認証UIを実装（完全カスタムデザイン可能）
- **完全無料セルフホスト**: `supabase/supabase` Docker Compose一式でどのサーバーでも起動可能
- **将来の柔軟性**: Supabase CloudへのアップグレードもDNS/接続文字列変更のみで可能
- **トレードオフ**: Supabaseのアップデートに追従するメンテナンスコストが発生する（ただしOSSプロジェクトのアクティビティは非常に高い）

## 参考

- Supabase OSS: https://github.com/supabase/supabase
- GoTrue: https://github.com/supabase/gotrue
- Supabase セルフホストガイド: https://supabase.com/docs/guides/self-hosting/docker
- ADR-001: docs/adr/001-system-architecture.md
