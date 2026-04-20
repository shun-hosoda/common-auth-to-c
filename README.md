# common-auth-to-c ローカル起動手順（画面操作テスト用）

この手順は **Windows + PowerShell** 前提です。  
**Gitリポジトリルート基準**で「どのフォルダで何を実行するか」を明示しています。

---

## 他プロジェクトからの利用 (配布運用)

### 利用側プロジェクトのセットアップ（認証基盤のみ）

```powershell
# 1. Compose スニペットをコピー
Copy-Item infra/docker/docker-compose.dist.yml <your-project>/infra/docker/docker-compose.auth.yml

# 2. 環境変数ファイルをコピー・編集
Copy-Item infra/docker/.env.example <your-project>/infra/docker/.env
```

この配布ファイルは **認証基盤（db/kong/auth/rest/inbucket）のみ** です。  
本番利用は、利用側プロジェクトで独自フロントを用意し、`NEXT_PUBLIC_SUPABASE_URL=http://localhost:8100` を設定してください。

### バージョン更新方法（利用側）

```powershell
# 認証基盤の配布ファイルを最新に差し替え後
docker compose pull
docker compose up -d
```

### 修正・リリース方法（このリポジトリ管理者）

```powershell
# バグ修正・コミット後
git tag v1.2.1
git push origin v1.2.1
# → GitHub Release / CHANGELOG として配布
```

リリースノートは [CHANGELOG.md](CHANGELOG.md) を参照。

配布運用の詳細手順は [docs/infra/auth-platform-distribution-guide.md](docs/infra/auth-platform-distribution-guide.md) を参照。

フロントをそのまま移植する場合は、同ドキュメントの「4.5 最小移植チェックリスト」を参照。

---

## 0. 前提

- Docker Desktop が起動済み
- Node.js 20+（フロント単体起動時に使用）
- リポジトリを `git clone` 済み

以降、次の変数で表記します。

- `<repo-root>` = このリポジトリのルート（`common-auth-to-c/`）

---

## 1. 初回セットアップ（環境変数ファイル作成）

### 1-1. リポジトリルートへ移動

実行フォルダ: **任意**

```powershell
cd <repo-root>
```

### 1-2. `.env` を作成（Docker用）

実行フォルダ: **`<repo-root>`**

```powershell
Copy-Item infra/docker/.env.example infra/docker/.env
```

### 1-3. `.env.local` を作成（Next.js用）

実行フォルダ: **`<repo-root>`**

```powershell
Copy-Item frontend/.env.local.example frontend/.env.local
```

### 1-4. 値を設定

#### 編集ファイル1: `infra/docker/.env`

`ANON_KEY` / `SERVICE_ROLE_KEY` / `JWT_SECRET` はローカル開発用の固定値がサンプルに記入済みです。  
以下のみ変更が必要です。

- `POSTGRES_PASSWORD`（任意。デフォルトのままでも動作します）
- （Google ログインを試すなら）`GOTRUE_EXTERNAL_GOOGLE_*`

> ⚠️ **本番環境では必ず全シークレットを再生成してください。**

#### 編集ファイル2: `frontend/.env.local`

こちらも開発用の値が記入済みのため、**通常は編集不要**です。  
`infra/docker/.env` のキーを変えた場合のみ合わせてください。

- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:8100`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEYと同じ値>`
- `NEXT_PUBLIC_APP_URL=http://localhost:3100`
- `SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEYと同じ値>`

> 注意: `SUPABASE_SERVICE_ROLE_KEY` は `NEXT_PUBLIC_` を付けないこと。

---

## 2. 3000番ポートが使えない場合（このプロジェクトの推奨値: 3100）

3000番を別アプリが使用している前提で、**このプロジェクトは 3100 番で起動**します。

### 2-1. Dockerの公開ポートを変更

編集ファイル: `infra/docker/docker-compose.yml`

`nextjs` サービスの `ports` を次のように変更:

```yaml
ports:
	- "3100:3000"
```

### 2-2. GoTrueのサイトURLを変更

編集ファイル: `infra/docker/.env`

```dotenv
SITE_URL=http://localhost:3100
ADDITIONAL_REDIRECT_URLS=http://localhost:3100/auth/callback
```

### 2-3. メール確認リンク用URL（実装依存）を変更

編集ファイル: `frontend/src/actions/auth.ts`

以下の値を `frontend/.env.local` と Docker の `nextjs` 環境変数に設定してください。

```ts
NEXT_PUBLIC_APP_URL=http://localhost:3100
```

> 現状実装は `NEXT_PUBLIC_APP_URL` を優先して確認メールの遷移先を組み立てます。

---

## 3. アプリ起動（推奨: Docker一括起動）

### 3-1. Docker Compose起動

実行フォルダ: **`<repo-root>/infra/docker`**

```powershell
cd <repo-root>/infra/docker
docker compose up -d --build
```

### 3-2. 起動確認

実行フォルダ: **`<repo-root>/infra/docker`**

```powershell
docker compose ps
```

`db`, `auth`, `kong`, `rest`, `inbucket`, `nextjs` が `Up` ならOK。

---

## 4. 画面操作テストで使うURL（3100運用）

- アプリ: `http://localhost:3100`
- 認証APIゲートウェイ(Kong): `http://localhost:8100`
- メール確認画面(Inbucket): `http://localhost:9000`

---

## 5. 画面操作テストの最小シナリオ

1. `http://localhost:3100/register` で新規登録
2. `http://localhost:9000` で確認メールを開き、確認リンクを押す
3. `http://localhost:3100/login` でログイン
4. `http://localhost:3100/home` 表示確認
5. `http://localhost:3100/profile` でプロフィール更新
6. 同ページの「退会する」で退会動作確認（確認ダイアログあり）

---

## 6. 停止・再起動

### 停止

実行フォルダ: **`<repo-root>/infra/docker`**

```powershell
docker compose down
```

### 再起動

実行フォルダ: **`<repo-root>/infra/docker`**

```powershell
docker compose up -d
```

### ログ確認

実行フォルダ: **`<repo-root>/infra/docker`**

```powershell
docker compose logs -f nextjs
```

（認証系を確認したい場合）

```powershell
docker compose logs -f auth
```

---

## 7. フロント単体起動（任意）

Dockerの `nextjs` を使わず、ローカル Node で起動する場合。

### 7-1. Auth基盤だけ起動

実行フォルダ: **`<repo-root>/infra/docker`**

```powershell
docker compose up -d db kong auth rest inbucket
```

### 7-2. フロント起動（3100）

実行フォルダ: **`<repo-root>/frontend`**

```powershell
cd <repo-root>/frontend
npm install
npm run dev -- -p 3100
```

---

## 8. 開発時の品質確認コマンド（任意）

実行フォルダ: **`<repo-root>/frontend`**

```powershell
npm run typecheck
npm run lint
npm run test:run
```

---

## 9. よくあるハマりどころ

### A. `cd frontend` でパスエラーになる

既に `frontend` にいる状態で `cd frontend` すると `frontend/frontend` になり失敗します。  
まず `Get-Location` で現在位置を確認してください。

### B. 3100番ポートも使用中

```powershell
netstat -ano | findstr :3100
```

競合する場合は `3200` など別ポートへ読み替え、
`docker-compose.yml` / `.env` / URL を同じ番号でそろえてください。

### C. メールが届かない

- `http://localhost:9000` を確認
- `infra/docker/.env` の `SMTP_HOST=inbucket`, `SMTP_PORT=2500` を確認

### D. Googleログインできない

- `infra/docker/.env` の `GOTRUE_EXTERNAL_GOOGLE_*` が設定済みか確認
- Google Cloud Console のリダイレクトURIが `http://localhost:8100/auth/v1/callback` か確認
