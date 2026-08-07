"use client";

/**
 * ui/toast —— 消息通知（Provider + Toast）（kumo 标准）
 *
 * @example
 * <ToastProvider>
  <Toast.Trigger render={(p) => <Button {...p}>显示消息</Button>} />
  <Toast.Title>标题</Toast.Title>
  <Toast.Description>内容</Toast.Description>
</ToastProvider>
 */
import { ToastProvider as KumoToastProvider } from "@cloudflare/kumo/components/toast";

export const ToastProvider = KumoToastProvider;
export default ToastProvider;
