"use client";

/**
 * ui/badge —— 状态/标签徽章
 *
 * 推荐语义变体（与产品状态对应）：
 * - success / green —— 已启用、已覆盖、通过
 * - warning / amber —— 待处理、需注意
 * - error / red —— 错误、已禁用
 * - neutral —— 默认、内置
 * - primary —— 品牌强调
 *
 * @example
 * <Badge variant="success">已覆盖</Badge>
 * <Badge variant="neutral">内置</Badge>
 */
import {
  Badge as KumoBadge,
  type BadgeVariant as KumoBadgeVariant,
} from "@cloudflare/kumo/components/badge";

/** kumo 未导出 BadgeProps，用 ComponentProps 提取 */
export type BadgeProps = React.ComponentProps<typeof KumoBadge>;
export type { KumoBadgeVariant as BadgeVariant };

export const Badge = KumoBadge;
export default Badge;
