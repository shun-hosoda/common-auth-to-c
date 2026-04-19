-- =============================================================
-- DB Init Script -- common-auth-to-c
-- =============================================================
-- このファイルは Supabase PostgreSQL 初期化時に自動実行される。
-- docs/db/schema.sql が Single Source of Truth（変更時はそちらを先に更新）。
--
-- auth.users 依存のオブジェクト（FK・trigger・RLS）は
-- db-migrate サービスが GoTrue 起動後に 02_post_auth_setup.sql で適用する。
-- =============================================================

-- エラーが出ても init を中断しない
\set ON_ERROR_STOP off

-- =============================================================
-- public.profiles: ユーザープロフィール（アプリ固有）
-- FK は GoTrue 起動後に db-migrate サービスが追加する
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY,
  display_name  VARCHAR(100),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted
  ON public.profiles(deleted_at)
  WHERE deleted_at IS NULL;

-- =============================================================
-- Trigger: profiles.updated_at 自動更新
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();