"use client";

/**
 * ui/index —— pi-web 自研组件库统一出口
 *
 * 标准来源：@cloudflare/kumo（Cloudflare 官方组件库，Base UI + Tailwind v4）
 * 微调项：见 docs/UI-COMPONENTS.md
 *
 * 使用规范：
 * 1. 所有新 UI 一律从 "@/components/ui" 导入，禁止直接 import "@cloudflare/kumo"
 * 2. 禁止新增内联 style 组件（迁移中的旧代码除外）
 * 3. 颜色一律使用语义 token（kumo-* 系列），禁止硬编码 hex
 * 4. 组件预览与示例见 http://127.0.0.1:37377/design
 */
export { Button } from "./button";
export type { ButtonProps } from "./button";

export { Field } from "./field";
export type { FieldProps } from "./field";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Select } from "./select";
export type { SelectProps } from "./select";

export { Switch } from "./switch";
export type { SwitchProps } from "./switch";

export { Badge } from "./badge";
export type { BadgeProps } from "./badge";

export { Dialog } from "./dialog";

export { Tabs } from "./tabs";

export { Text } from "./text";
export type { TextProps } from "./text";
