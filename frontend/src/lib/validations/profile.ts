import { z } from 'zod'

/**
 * プロフィール更新スキーマ
 * - display_name: 最大100文字、省略可
 * - avatar_url: http/https スキームのみ（javascript:/data: URL を排除）、省略可・null可
 */
export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .max(100, '表示名は100文字以下で入力してください')
    .optional(),
  avatar_url: z
    .string()
    .url('有効なURLを入力してください')
    .regex(/^https?:\/\//, 'http または https のURLを入力してください')
    .nullable()
    .optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
