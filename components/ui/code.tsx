"use client";

/**
 * ui/code —— 代码高亮块（kumo 标准）
 *
 * @example
 * <Code code="const a = 1" language="ts" />
 */
import { Code as KumoCode } from "@cloudflare/kumo/components/code";

export const Code = KumoCode;
export default Code;

/**
 * ui/code-highlighted —— 语法高亮代码块（官网独立组件，shiki 高亮）
 *
 * @example
 * <CodeHighlighted code="const a = 1" language="ts" />
 */
import { CodeHighlighted as KumoCodeHighlighted } from "@cloudflare/kumo/code";

export const CodeHighlighted = KumoCodeHighlighted;
