-- =============================================================
-- DB Schema — common-auth-to-c
-- =============================================================
-- 認証コア: GoTrueが管理する auth.* スキーマは変更禁止
-- アプリ固有: public.* スキーマのみ管理する
--
-- GoTrueが自動管理するテーブル（参照のみ）:
--   auth.users              ユーザー基本情報
--   auth.identities         OAuthプロバイダリンク
--   auth.refresh_tokens     リフレッシュトークン
--   auth.sessions           セッション管理
--
-- 命名規約:
--   テーブル名: snake_case, 複数形
--   カラム名:   snake_case
--   インデックス: idx_{テーブル名}_{カラム名}
-- =============================================================

-- =============================================================
-- public.profiles: ユーザープロフィール（アプリ固有）
-- auth.users.id を主キーとして参照
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  VARCHAR(100),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ           -- ソフトデリート（退会申請時に設定）
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_profiles_deleted
  ON public.profiles(deleted_at)
  WHERE deleted_at IS NULL;

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ参照可能
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

-- 自分のプロフィールのみ更新可能
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
      NEW.raw_user_meta_data->>'full_name',  -- Google OAuth
      NEW.raw_user_meta_data->>'name',        -- その他OAuthプロバイダ
      split_part(NEW.email, '@', 1)           -- メール/PW登録時のフォールバック
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- 将来追加予定（Phase 2/3）:
--   public.mfa_settings     MFA設定
--   public.passkeys         WebAuthn/FIDO2パスキー
--   public.audit_logs       監査ログ
-- =============================================================

