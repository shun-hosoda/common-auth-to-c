# ADR-004: データアーキテクチャ

## ステータス

提案中

## コンテキスト

ADR-002で Supabase Auth (GoTrue / OSS) を採用した。
認証データは `auth.*` スキーマに保持されるため、アプリ固有データの設計方針を定義する。

## 決定

GoTrue管理スキーマ（`auth.*`）は変更せず、アプリ固有データは `public.profiles` に集約する。

### 前提（GoTrue管理）

```sql
auth.users
auth.identities
auth.refresh_tokens
auth.sessions
auth.mfa_factors
```

`auth.users.id` をアプリ側主キー参照として使用する。

### アプリ固有テーブル

```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  VARCHAR(100),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_profiles_deleted
  ON public.profiles(deleted_at)
  WHERE deleted_at IS NULL;
```

### RLS方針

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL);
```

### ユーザー作成トリガー

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Redis利用方針

GoTrue非対応の補完用途（追加レート制限等）のみに限定し、JWTブラックリスト用途では使わない。

### 退会・保持ポリシー

- Phase 1: `public.profiles.deleted_at` を設定しUI/APIから非表示
- 30日後: Supabase Admin API で `auth.users` を削除（CASCADEで`public.profiles`削除）

## 選択肢

### 選択肢A: `auth.*` スキーマへ直接カラム追加
- メリット: 管理対象テーブルが減る
- デメリット: GoTrueアップデート互換性を壊す

### 選択肢B: `public.profiles` 分離 ✅ 採用
- メリット: GoTrueと疎結合、RLS運用が明確、将来拡張しやすい
- デメリット: 一部クエリでJOINが必要

### 選択肢C: GoTrueと別PostgreSQL
- メリット: 分離度が高い
- デメリット: 運用負荷と構成複雑性が増える

## 結果

- DBの責任境界が明確化（認証: GoTrue / アプリ: public）
- MVPでは1テーブルで要件を満たし、拡張余地を維持
- 仕様矛盾を排除し、Single Source of Truthを維持

## 参考

- Supabase Auth Schema: https://supabase.com/docs/guides/auth/managing-user-data
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- ADR-002: docs/adr/002-technology-stack.md
