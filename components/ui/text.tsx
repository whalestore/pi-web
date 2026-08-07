"use client";

/**
 * ui/text —— 文本排版（kumo 字体标准）
 *
 * 字号层级（kumo 标准）：
 * - variant="heading1"  → text-3xl (30px) 页面主标题
 * - variant="heading2"  → text-2xl (24px) 区块标题
 * - variant="heading3"  → text-lg  (18px) 小节标题
 * - variant="body"      → text-base(16px) 正文（默认）
 * - variant="secondary" → 次要信息（text-kumo-subtle）
 * - variant="mono"      → 等宽代码
 *
 * 辅助修饰 size：xs(12) / sm(14) / base(16) / lg(18)
 *
 * @example
 * <Text variant="heading2">区块标题</Text>
 * <Text variant="heading3">小节标题</Text>
 * <Text variant="secondary" size="sm">辅助说明</Text>
 * <Text variant="mono" size="sm">deepseek-v4-pro</Text>
 */
import { Text as KumoText } from "@cloudflare/kumo/components/text";

export type TextProps = React.ComponentProps<typeof KumoText>;

export const Text = KumoText;
export default Text;
