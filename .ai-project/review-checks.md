# レビュー時の型チェック・テスト・ビルドコマンド

> 技術スタック確定後に各コマンドを更新すること。

## 型チェック

```bash
# TypeScript（フロントエンド）— 技術スタック確定後に有効化
# cd frontend && npx tsc --noEmit

# Python（バックエンド）— 技術スタック確定後に有効化
# cd backend && mypy src/

# または統合コマンド
# npm run type-check
```

## リンター

```bash
# フロントエンド — 技術スタック確定後に有効化
# cd frontend && npm run lint

# バックエンド — 技術スタック確定後に有効化
# cd backend && ruff check src/
```

## テスト

```bash
# 単体テスト — 技術スタック確定後に有効化
# pytest tests/unit/ -v
# または: npm test

# 統合テスト
# pytest tests/integration/ -v

# E2Eテスト
# pytest tests/e2e/ -v

# カバレッジ
# pytest --cov=backend/src tests/ --cov-report=term-missing
```

## ビルド

```bash
# フロントエンド — 技術スタック確定後に有効化
# cd frontend && npm run build

# バックエンド — 技術スタック確定後に有効化
# cd backend && python -m build
# または: docker build -t common-auth-to-c .
```

## /review 実行時のチェック順

1. 型チェック（コンパイルエラーなし確認）
2. リンター（警告なし確認）
3. 単体テスト（全パス確認）
4. 差分レビュー（5人専門家）

> コンパイルエラーが出た場合は APPROVE せず即時修正してから再レビューする。
