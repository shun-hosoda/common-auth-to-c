import { test, expect } from '@playwright/test'

/**
 * E2E テスト — ログイン・ログアウトフロー (FR-002, FR-008)
 */
test.describe('ログイン', () => {
  test('未認証ユーザーは /home からログインページへリダイレクト', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login/)
  })

  test('不正な認証情報ではエラーが表示される', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('メールアドレス').fill('notexist@example.com')
    await page.getByLabel('パスワード').fill('wrongpassword')
    await page.getByRole('button', { name: 'ログイン' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'メールアドレスまたはパスワードが正しくありません'
    )
    await expect(page).toHaveURL('/login')
  })

  test('バリデーションエラー: メールアドレスが未入力', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('メールアドレス').fill('')
    await page.getByLabel('パスワード').fill('password123')
    await page.getByRole('button', { name: 'ログイン' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
})

test.describe('ログアウト', () => {
  // ログイン済み状態でのテスト（実装時に認証セットアップヘルパーを追加）
  test.skip('ログインユーザーがホームからログアウトできる', async ({ page }) => {
    // TODO: test helper で認証セッションをセットアップ
    await page.goto('/home')
    await page.getByRole('button', { name: 'ログアウト' }).click()
    await expect(page).toHaveURL('/login')
  })
})
