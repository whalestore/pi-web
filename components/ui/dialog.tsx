"use client";

/**
 * ui/dialog —— 模态弹框（复合组件）
 *
 * 结构：Root > Trigger + Dialog(内容) > Title/Description/Close
 * 注意：内容组件就是 Dialog 本身（没有 Dialog.Content）
 *
 * @example
 * <Dialog.Root open={open} onOpenChange={setOpen}>
 *   <Dialog.Trigger render={(p) => <Button {...p}>打开</Button>} />
 *   <Dialog>
 *     <Dialog.Title>插件配置</Dialog.Title>
 *     <Dialog.Description>对已安装插件进行管理</Dialog.Description>
 *     <div>…弹框主体…</div>
 *     <Dialog.Close render={(p) => <Button variant="secondary" {...p}>关闭</Button>} />
 *   </Dialog>
 * </Dialog.Root>
 */
import { Dialog as KumoDialog } from "@cloudflare/kumo/components/dialog";

export const Dialog = KumoDialog;
export default Dialog;
