#!/bin/bash
# =============================================================
# Supabase サービスロール作成スクリプト
# docker-entrypoint-initdb.d で 01_schema.sql より先に実行される
# POSTGRES_PASSWORD 環境変数を使用して各ロールのパスワードを設定
# =============================================================
set -e

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-your-super-secret-db-password}"

psql -v ON_ERROR_STOP=0 -U supabase_admin -d postgres <<-EOSQL
  -- Supabase サービスロール作成
  DO \$\$
  BEGIN
    -- supabase_auth_admin: GoTrue (認証サービス) が使用
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
      CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    -- authenticator: PostgREST が使用する接続ロール
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
      CREATE ROLE authenticator NOINHERIT LOGIN NOREPLICATION PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    -- anon: 未認証ユーザー向けロール
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN NOINHERIT NOREPLICATION NOBYPASSRLS;
    END IF;

    -- authenticated: 認証済みユーザー向けロール
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN NOINHERIT NOREPLICATION NOBYPASSRLS;
    END IF;

    -- service_role: 管理者権限ロール (RLS バイパス)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      CREATE ROLE service_role NOLOGIN NOINHERIT NOREPLICATION BYPASSRLS;
    END IF;

    -- supabase_replication_admin: レプリケーション用
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_replication_admin') THEN
      CREATE ROLE supabase_replication_admin LOGIN REPLICATION PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    -- supabase_read_only_user: 読み取り専用
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_read_only_user') THEN
      CREATE ROLE supabase_read_only_user BYPASSRLS INHERIT LOGIN NOREPLICATION PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    -- postgres: GoTrue migration が GRANT ... TO postgres を実行するため必要
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
      CREATE ROLE postgres SUPERUSER NOLOGIN;
    END IF;
  END
  \$\$;

  -- authenticator に anon/authenticated/service_role/supabase_auth_admin を付与
  GRANT anon TO authenticator;
  GRANT authenticated TO authenticator;
  GRANT service_role TO authenticator;
  GRANT supabase_auth_admin TO authenticator;

  -- supabase_admin に全ロールを付与
  GRANT anon TO supabase_admin;
  GRANT authenticated TO supabase_admin;
  GRANT service_role TO supabase_admin;

  -- PostgreSQL 15+ の public スキーマ権限付与
  -- (PG15 でデフォルトの CREATE 権限が削除されたため明示的に付与)
  GRANT USAGE, CREATE ON SCHEMA public TO supabase_auth_admin;
  GRANT USAGE, CREATE ON SCHEMA public TO authenticator;
  GRANT USAGE ON SCHEMA public TO anon;
  GRANT USAGE ON SCHEMA public TO authenticated;
  GRANT USAGE ON SCHEMA public TO service_role;

  -- auth スキーマ作成 (GoTrue が migration 時に期待する)
  -- 所有者を supabase_auth_admin にして GoTrue が自由にテーブルを操作できるようにする
  CREATE SCHEMA IF NOT EXISTS auth;
  ALTER SCHEMA auth OWNER TO supabase_auth_admin;
  GRANT USAGE, CREATE ON SCHEMA auth TO supabase_auth_admin;
  GRANT USAGE ON SCHEMA auth TO authenticator;
  GRANT USAGE ON SCHEMA auth TO anon;
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT USAGE ON SCHEMA auth TO service_role;
  GRANT ALL ON SCHEMA auth TO supabase_admin;

  -- GoTrue migration が期待する enum 型を supabase_auth_admin 所有で作成
  -- (20240314 以降の migration で ALTER TYPE ... ADD VALUE 'phone' が実行される)
  -- supabase_auth_admin として実行しないと "must be owner of type" エラーになる
  SET ROLE supabase_auth_admin;
  CREATE TYPE auth.factor_type AS ENUM ('totp', 'webauthn');
  CREATE TYPE auth.factor_status AS ENUM ('unverified', 'verified');
  CREATE TYPE auth.aal_level AS ENUM ('aal1', 'aal2', 'aal3');
  RESET ROLE;
EOSQL
