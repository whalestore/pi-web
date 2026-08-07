"use client";

/**
 * ui/field —— 表单字段容器（label + 控件 + 描述 + 错误）
 *
 * 直接使用 kumo Field，统一从 ui 入口导出。
 * 配合 ui/input、ui/select 使用：
 * @example
 * <Field label="默认模型" description="支持模糊匹配">
 *   <Input value={model} onChange={...} />
 * </Field>
 */
import { Field as KumoField, type FieldProps as KumoFieldProps } from "@cloudflare/kumo/components/field";

export type FieldProps = KumoFieldProps;

export const Field = KumoField;
export default Field;
