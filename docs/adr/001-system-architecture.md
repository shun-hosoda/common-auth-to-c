# ADR-001: システムアーキテクチャパターン

## ステータス

提案中

## コンテキスト

toC向けSaaS認証基盤を新規構築する。以下の制約・要件がある:

- **クラウド非依存**: 特定クラウドプロバイダに依存しない汎用的な設計
- **水平スケール**: 10,000+同時接続に対応可能な設計（NFR）
- **将来拡張**: MFA、パスキー、マルチテナント等のPhase 2/3機能を追加予定
- **MVP優先**: Phase 1はメール/PW + Google OAuthに集中
- **共通基盤**: 複数SaaSプロダクトから利用される認証サービス

## 決定

**Supabase Auth (OSS) を認証コアとして利用し、アプリケーション層は Next.js で構成するモジュラー設計**を採用する。

> 技術スタックの詳細は ADR-002 を参照。

### アーキテクチャ概要

```
┌───────────────────────────────────────────────────┐
│                    Clients                         │
│        (Next.js SPA / Mobile / 外部SaaS)          │
└────────────────────┬──────────────────────────────┘
                     │ HTTPS
┌────────────────────▼──────────────────────────────┐
│              Reverse Proxy (Nginx/Traefik)         │
│         TLS終端 / レート制限 / CORS               │
└──────┬──────────────────────────┬─────────────────┘
       │ /auth/*                  │ /api/* + /
┌──────▼──────────────────┐  ┌───▼────────────────────────┐
│   Supabase Auth          │  │  Next.js (App Router)       │
│   GoTrue (OSS)          │  │  ─────────────────────────  │
│  ───────────────────    │  │  app/(auth)/                │
│  - メール/PW 登録/ログイン│  │    login/, register/,       │
│  - Google OAuth (PKCE)  │  │    reset-password/          │
│  - JWT (RS256) 発行     │  │                             │
│  - リフレッシュトークン  │  │  app/(app)/                 │
│  - メール確認・PW リセット│  │    profile/, settings/     │
│  - レート制限           │  │                             │
│  - セッション管理        │  │  components/auth/           │
└──────┬──────────────────┘  │    LoginForm, RegisterForm  │
       │                     │    OAuthButton, etc.        │
┌──────▼──────────────────┐  └────────────────────────────┘
│   PostgreSQL 16         │
│   (Supabase内蔵)        │
│  ─────────────────────  │
│  auth.users             │← GoTrueが管理
│  auth.identities        │← OAuth連携
│  auth.refresh_tokens    │← トークン管理
│  auth.sessions          │           ┌──────────────────┐
│                         │           │   Redis 7         │
│  public.profiles        │← アプリ固有│  ──────────────── │
│  (1テーブルのみ)         │           │  rate:login:ip:* │
└─────────────────────────┘           │  (追加レート制限) │
                                      └──────────────────┘
```

### モジュール構成（Next.js）

```
frontend/src/
├── app/
│   ├── (auth)/                # 認証ページ群
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   └── reset-password/
│   └── (app)/                 # 認証済みページ群
│       ├── profile/
│       └── settings/
├── components/
│   ├── auth/                  # 認証UIコンポーネント
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── OAuthButton.tsx
│   │   └── PasswordResetForm.tsx
│   └── ui/                    # 汎用UIコンポーネント
├── hooks/
│   ├── useAuth.ts             # Supabase Auth状態管理
│   └── useProfile.ts          # プロフィールデータ
└── lib/
    ├── supabase/
    │   ├── client.ts          # ブラウザ用クライアント
    │   └── server.ts          # サーバー用クライアント (SSR)
    └── auth/
        └── middleware.ts      # 認証ミドルウェア
```

## 選択肢

### 選択肢A: カスタム実装（FastAPI モジュラーモノリス）
- **メリット**: 認証ロジックを完全制御。学習・PoC目的に最適
- **デメリット**: argon2id実装・JWT管理・OAuth・レート制限など全セキュリティを自前保証する必要あり。開発コストが最大

### 選択肢B: Supabase OSS セルフホスト ✅ 採用
- **メリット**: 無料。GoTrueが認証の複雑な部分を全て担う。PostgreSQL統合でRLS活用可能。Docker Composeでどこでもデプロイ可能。Next.js公式SDKが充実
- **デメリット**: GoTrueのスキーマに一定の制約（`auth.*`は変更不可）。Supabase以外への認証移行はやや手間

### 選択肢C: Keycloak / Authentik
- **メリット**: エンタープライズ機能豊富
- **デメリット**: toC向けのシンプルなログインUXに対して過剰。重量級でMVP速度を損なう

### 選択肢D: マイクロサービス（認証サービスを独立デプロイ）
- **メリット**: 各サービスの独立スケーリング
- **デメリット**: Phase 1のMVPには過剰。分散システムの複雑性が増大

## 結果

- **Supabase Auth (OSS)** が認証の複雑な部分（JWT・リフレッシュトークン・OAuth・メール確認）を全て担当
- **Next.js** でUI層を実装。`supabase-js` SDK経由でGoTrueと通信
- アプリ固有のDBテーブル（`public.profiles`）を最小限に抑え、GoTrueの`auth.*`スキーマはそのまま利用
- **Docker Composeでセルフホスト** → クラウド非依存。どのVPS/クラウドにもデプロイ可能
- **認証実装コストをほぼゼロに削減** しながら、セキュリティ品質はGoTrueが保証

## 参考

- Supabase OSS: https://github.com/supabase/supabase
- Supabase セルフホストガイド: https://supabase.com/docs/guides/self-hosting/docker
- ADR-002: docs/adr/002-technology-stack.md
