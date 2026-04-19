/**
 * Unit tests — lib/validations/profile.ts
 */
import { describe, it, expect } from 'vitest'
import { profileUpdateSchema } from '../profile'

describe('profileUpdateSchema', () => {
  it('有効な display_name のみを受け入れる', () => {
    const result = profileUpdateSchema.safeParse({ display_name: 'テストユーザー' })
    expect(result.success).toBe(true)
  })

  it('display_name が 100 文字を超える場合はエラー', () => {
    const result = profileUpdateSchema.safeParse({ display_name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.display_name).toBeDefined()
    }
  })

  it('有効な https avatar_url を受け入れる', () => {
    const result = profileUpdateSchema.safeParse({
      avatar_url: 'https://example.com/avatar.png',
    })
    expect(result.success).toBe(true)
  })

  it('有効な http avatar_url を受け入れる', () => {
    const result = profileUpdateSchema.safeParse({
      avatar_url: 'http://example.com/avatar.png',
    })
    expect(result.success).toBe(true)
  })

  it('javascript: スキームの avatar_url を拒否する', () => {
    const result = profileUpdateSchema.safeParse({
      avatar_url: 'javascript:alert(1)',
    })
    expect(result.success).toBe(false)
  })

  it('data: スキームの avatar_url を拒否する', () => {
    const result = profileUpdateSchema.safeParse({
      avatar_url: 'data:text/html,<script>alert(1)</script>',
    })
    expect(result.success).toBe(false)
  })

  it('avatar_url が null の場合は有効', () => {
    const result = profileUpdateSchema.safeParse({ avatar_url: null })
    expect(result.success).toBe(true)
  })

  it('全フィールドが省略された場合でも有効（全 optional）', () => {
    const result = profileUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('display_name と avatar_url の両方が有効な場合', () => {
    const result = profileUpdateSchema.safeParse({
      display_name: 'ユーザー',
      avatar_url: 'https://cdn.example.com/img/user.jpg',
    })
    expect(result.success).toBe(true)
  })
})
