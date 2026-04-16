# ADR-003: 認証・トークン戦略

## ステータス

提案中

## コンテキスト

ADR-002で Supabase Auth (GoTrue / OSS) を認証基盤として採用した。
GoTrueが提供するトークン戦略をそのまま利用するか、カスタマイズが必要かを確認する。

## 決定

GoTrue (Supabase Auth) のトークン戦略を採用し、認証ロジックの自前実装は行わない。

### 採用するトークン戦略

| 項目 | GoTrue の動作 | 方針 |
|------|--------------|------|
| アクセストークン形式 | JWT (RS256) | 採用 |
| アクセストークン有効期限 | デフォルト1時間（設定可） | 900秒（15分）へ短縮 |
| リフレッシュトークン | Opaque（DB管理） | 採用 |
| リフレッシュトークン検証 | DB照合 + 使用時ローテーション | 採用 |
| パスワードハッシュ | bcrypt（GoTrue管理） | 採用 |
| Google OAuth | Authorization Code + PKCE | 採用 |
| メール確認/リセット | GoTrue内蔵フロー | 採用 |

### セキュリティ対策（責任分界）

| 脅威 | 対策 | 担当 |
|------|------|------|
| ブルートフォース | GoTrueレート制限 + プロキシ補完 | GoTrue + Nginx/Traefik |
| セッション固定 | ログイン時に新規トークンペア発行 | GoTrue |
| リフレッシュトークン漏洩 | ローテーション + 再使用検知 | GoTrue |
| XSS | Cookieベースセッション（HttpOnly） | `@supabase/ssr` |
| CSRF | SameSite Cookie + Origin検証 | GoTrue + アプリ層 |
| メール列挙 | GoTrue設定で抑制 | GoTrue |

### 設定方針

```toml
[auth]
jwt_expiry = 900
```

MVP Phase 1ではアクセストークン有効期限を 900 秒に設定する。

## 選択肢

### 選択肢A: GoTrue標準採用（設定のみ調整） ✅ 採用
- メリット: 自前実装不要、監査実績のある実装を利用できる
- デメリット: bcrypt固定など一部カスタマイズ制約がある

### 選択肢B: GoTrue上に独自トークン層を追加
- メリット: 任意仕様へ完全カスタム可能
- デメリット: 二重管理になり複雑性と不具合リスクが増える

### 選択肢C: 完全自前実装
- メリット: 実装自由度が最大
- デメリット: ADR-002の採用方針と矛盾し、開発・運用コストが高い

## 結果

- JWT RS256 + Opaque Refresh の構成で高速検証と失効制御を両立
- 認証実装コストを削減し、MVP速度を確保
- 責任境界を明確化（GoTrue担当 / アプリ担当）

## 参考

- GoTrue: https://github.com/supabase/gotrue
- Supabase Auth設定: https://supabase.com/docs/guides/auth/configuration
- ADR-002: docs/adr/002-technology-stack.md
