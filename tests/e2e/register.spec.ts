import { test, expect } from '@playwright/test'

/**
 * E2E テスト — メール/パスワード登録フロー (FR-001, FR-003)
 * 事前条件: Supabase ローカルが起動済み、SMTP(inbucket) が利用可能
 */
test.describe('ユーザー登録', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'Password123!'

  test('登録フォームに入力してメール確認ページへ遷移', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('メールアドレス').fill(testEmail)
    await page.getByLabel('パスワード', { exact: true }).fill(testPassword)
    await page.getByLabel('パスワード（確認）').fill(testPassword)

    await page.getByRole('button', { name: 'アカウントを作成' }).click()

    await expect(page).toHaveURL('/verify-email')
    await expect(page.getByRole('heading', { name: 'メールアドレスの確認' })).toBeVisible()
  })

  test('パスワードが一致しない場合はエラー表示', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('メールアドレス').fill(testEmail)
    await page.getByLabel('パスワード', { exact: true }).fill(testPassword)
    await page.getByLabel('パスワード（確認）').fill('different123!')

    await page.getByRole('button', { name: 'アカウントを作成' }).click()

    await expect(page.getByRole('alert')).toContainText('パスワードが一致しません')
    await expect(page).toHaveURL('/register')
  })
})
