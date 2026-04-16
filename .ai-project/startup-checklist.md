# 起動前セルフチェックリスト

AIがセッション開始時に確認すべき項目。

## 必須チェック

- [ ] `CLAUDE.md` を読んだ
- [ ] `.ai-project/context.md` を読んだ
- [ ] 現在の工程ステータスを確認した
- [ ] `docs/_summary.md` が存在すれば読んだ（トークン効率化）
- [ ] 直近の `docs/review/logs/` の最新ログを確認した（指摘残あれば対応）

## 工程ステータス確認

| 確認項目 | 確認方法 |
|----------|----------|
| 現在のブランチ | `git branch --show-current` |
| 未コミット変更 | `git status` |
| 直近のコミット | `git log --oneline -5` |
| PRDステータス | `docs/prd/prd.md` の「ステータス」欄 |
| 設計ステータス | `docs/design/` の最新ファイル |
| レビューステータス | `docs/review/logs/` の最新ファイル |

## 工程に応じた追加確認

### 要件定義工程
- [ ] `docs/prd/prd.md` の現在の記載内容を確認

### 設計工程
- [ ] PRDが承認済みであることを確認
- [ ] `docs/review/persona.md` のドメインペルソナを確認

### 実装工程
- [ ] 設計が承認済みであることを確認
- [ ] `docs/api/openapi.yaml` の最新API仕様を確認
- [ ] `docs/db/schema.sql` の最新スキーマを確認

### レビュー工程
- [ ] 実装が完了していることを確認
- [ ] 型チェック・リンター・テストが通ることを確認（`.ai-project/review-checks.md`）
