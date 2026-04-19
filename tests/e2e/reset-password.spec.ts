import { test, expect } from '@playwright/test'

/**
 * E2E テスト — パスワードリセットフロー (FR-004)
 */
test.describe('パスワードリセット', () => {
  test('リセット申請フォームを送信すると送信完了メッセージが表示される', async ({ page }) => {
    await page.goto('/reset-password')

    await page.getByLabel('メールアドレス').fill('user@example.com')
    await page.getByRole('button', { name: 'リセットメールを送信' }).click()

    await expect(page.getByText('パスワードリセットのメールを送信しました')).toBeVisible()
  })

  test('不正なメールアドレスはバリデーションエラー', async ({ page }) => {
    await page.goto('/reset-password')

    await page.getByLabel('メールアドレス').fill('not-an-email')
    await page.getByRole('button', { name: 'リセットメールを送信' }).click()

    await expect(page.getByRole('alert')).toContainText('有効なメールアドレスを入力してください')
  })
})
