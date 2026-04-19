-- =============================================================
-- Post-Auth Setup SQL — common-auth-to-c
-- =============================================================
-- このファイルは GoTrue (auth) が起動・初期化完了した後に
-- db-migrate サービスによって実行される。
-- auth.users テーブルが存在する前提で FK・trigger・RLS を設定する。
-- =============================================================

-- profiles.id -> auth.users.id FK (ユーザー削除時に CASCADE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: select own" ON public.profiles;
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL);

-- =============================================================
-- Trigger: auth.users 作成時に public.profiles を自動生成
-- =============================================================
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- GoTrue search_path 設定
-- supabase_auth_admin が auth.* テーブルをスキーマ指定なしで参照できるようにする
-- =============================================================
ALTER ROLE supabase_auth_admin SET search_path TO auth;

-- =============================================================
-- GoTrue v2.164.0 バックフィルマイグレーション スキップ
-- 20221208132122: "id = user_id::text" (uuid = text) 比較で失敗するため
-- 新規 DB では不要なバックフィルをスキップする
-- =============================================================
INSERT INTO auth.schema_migrations (version)
SELECT '20221208132122'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.schema_migrations WHERE version = '20221208132122'
);
