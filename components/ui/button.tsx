"use client";

/**
 * ui/button —— 基于 @cloudflare/kumo 的按钮包装
 *
 * 微调：默认 size 改为 sm（贴合 pi-web 现有 12px/紧凑风格），
 * 其余全部透传 kumo 的 variant/size 体系。
 *
 * @example
 * <Button variant="primary" size="sm">保存</Button>
 * <Button variant="secondary">取消</Button>
 * <Button variant="destructive">删除</Button>
 * <Button variant="ghost" loading>提交中…</Button>
 */
import { Button as KumoButton, type ButtonProps as KumoButtonProps } from "@cloudflare/kumo/components/button";

export type ButtonProps = KumoButtonProps;

export function Button({ size = "sm", ...props }: ButtonProps) {
  return <KumoButton size={size} {...props} />;
}

export default Button;
