# 認証基盤 配布運用ガイド（common-auth-to-c）

このドキュメントは、`common-auth-to-c` を「認証基盤だけ共通配布」するための運用手順書です。  
利用側サービスは、フロントエンドを自由に実装し、認証基盤のみを共通利用します。

---

## 1. 何を配布するか

配布対象は以下のコンテナ群です（`infra/docker/docker-compose.dist.yml`）。

- `db`（PostgreSQL）
- `kong`（API Gateway）
- `auth`（GoTrue: 認証コア）
- `inbucket`（開発用メール受信）
- `db-migrate`（初期化後の後処理）

> フロントエンドは配布対象外です。各プロジェクト側で自由に実装します。

---

## 2. 全体アーキテクチャ

```text
[Consumer Frontend]
   |
   |  NEXT_PUBLIC_SUPABASE_URL=http://localhost:8100
   v
[Kong :8100] ----> [GoTrue(Auth)]
      |
      +---------> [Postgres(DB)]

[Inbucket :9000]  (確認メール閲覧)
```

役割:
- フロントは Kong にだけ接続
- 認証処理は GoTrue が実行
- ユーザー・セッション等は Postgres に保存
- メール確認は Inbucket で開発検証

---

## 3. 利用側プロジェクト導入手順

### 3-1. ファイルコピー

```powershell
Copy-Item <this-repo>/infra/docker/docker-compose.dist.yml <your-project>/infra/docker/docker-compose.auth.yml
Copy-Item <this-repo>/infra/docker/.env.example <your-project>/infra/docker/.env
```

### 3-2. 必須設定

`<your-project>/infra/docker/.env`:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `ANON_KEY`
- `SERVICE_ROLE_KEY`
- `SITE_URL`
- `ADDITIONAL_REDIRECT_URLS`

### 3-3. 起動

```powershell
cd <your-project>/infra/docker
docker compose -f docker-compose.auth.yml up -d
```

### 3-4. 疎通確認

- Kong: `http://localhost:8100`
- Inbucket: `http://localhost:9000`
- Auth health（内部）: `http://auth:9999/health`

---

## 4. 利用側フロントの最低要件

フロント側の `.env` 例:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8100
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEYと同じ値>
NEXT_PUBLIC_APP_URL=http://localhost:3100
```

注意:
- `SERVICE_ROLE_KEY` をブラウザ公開変数（`NEXT_PUBLIC_`）に入れない
- メール確認先（`SITE_URL`）とフロント公開URLを一致させる

---

## 5. 更新運用（共通基盤の配布）

### 推奨方式

- このリポジトリを単一の真実源（source of truth）にする
- 修正はこのリポジトリへ集約
- 配布は `git tag` + `CHANGELOG.md` で管理

### 管理者手順

1. 不具合修正をこのリポジトリにコミット
2. `CHANGELOG.md` に追記
3. `git tag vX.Y.Z` / `git push origin vX.Y.Z`
4. 利用側へ「更新内容・影響範囲・移行手順」を通知

### 利用側手順

1. 最新 `docker-compose.dist.yml` と `.env.example` を取り込む
2. 自プロジェクト `.env` を差分反映
3. 再起動

```powershell
docker compose -f docker-compose.auth.yml pull
docker compose -f docker-compose.auth.yml up -d
```

---

## 6. 障害時の切り分け手順

### 6-1. まず見る場所

```powershell
docker compose -f docker-compose.auth.yml ps
docker compose -f docker-compose.auth.yml logs -f auth
docker compose -f docker-compose.auth.yml logs -f kong
```

### 6-2. 典型症状

- `401 Invalid authentication credentials`
  - Kong key-auth 設定と `ANON_KEY` 不一致を確認
- `no Route matched with those values`
  - Kong route 設定とアクセスURL不一致
- メール確認後にログインできない
  - `SITE_URL` / `ADDITIONAL_REDIRECT_URLS` とフロントURLの整合確認

---

## 7. Docker Hub アカウントは必要か？

結論: **通常のローカル開発では不要**です。

理由:
- `docker compose` は公開イメージ（`supabase/*`, `kong`, `inbucket`）を匿名 pull 可能
- この運用は「自前イメージを Docker Hub に push」前提ではない

ただし以下の場合はアカウントがあると有利です:
- CI で大量 pull して rate limit に当たる場合
- 将来、独自ビルドイメージを Docker Hub に配布したい場合

代替案:
- GitHub Container Registry（GHCR）を使う
- 社内ミラー（Harbor 等）を使う

---

## 8. セキュリティ運用の最低ライン

- 本番では `JWT_SECRET` / `ANON_KEY` / `SERVICE_ROLE_KEY` を必ず再生成
- `.env` を Git 管理しない（すでに `.gitignore` 前提）
- `SERVICE_ROLE_KEY` をフロントに公開しない
- `ADDITIONAL_REDIRECT_URLS` は必要最小限に制限

---

## 9. 将来拡張（必要になったら）

- 監視: healthcheck + metrics
- 監査: 認証イベントの永続ログ
- テナント分離: 環境ごとの compose/secret 分割
- 配布自動化: release artifact（設定テンプレート）生成

---

## 10. 参照ファイル

- `infra/docker/docker-compose.dist.yml`
- `infra/docker/.env.example`
- `infra/docker/volumes/api/kong.yml`
- `infra/docker/volumes/db/migrations/02_post_auth_setup.sql`
- `CHANGELOG.md`
