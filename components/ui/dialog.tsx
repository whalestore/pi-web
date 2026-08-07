"use client";

/**
 * ui/dialog —— 模态弹框（复合组件）
 *
 * 结构：Root > Trigger + Dialog(内容) > Title/Description/Close
 * 注意：内容组件就是 Dialog 本身（没有 Dialog.Content）
 *
 * 微调：统一约束弹框最大高度（max-h-[85dvh]），内容超高时由内部滚动区处理；
 * 宽度用 size 控制（base 384 / sm 288 / lg 512 / xl 768），
 * 需要更宽时传 className="sm:w-[860px]"（tailwind-merge 自动覆盖）。
 *
 * @example
 * <Dialog.Root open={open} onOpenChange={setOpen}>
 *   <Dialog.Trigger render={(p) => <Button {...p}>打开</Button>} />
 *   <Dialog size="xl" className="sm:w-[860px]">
 *     <Dialog.Title>插件配置</Dialog.Title>
 *     <Dialog.Description>对已安装插件进行管理</Dialog.Description>
 *     <div className="flex-1 overflow-y-auto">…弹框主体…</div>
 *     <Dialog.Close render={(p) => <Button variant="secondary" {...p}>关闭</Button>} />
 *   </Dialog>
 * </Dialog.Root>
 */
import { Dialog as KumoDialog } from "@cloudflare/kumo/components/dialog";
import { cn } from "@cloudflare/kumo/utils";

/** 保留 kumo Dialog 的静态子组件（Root/Trigger/Title/Description/Close） */
export const Dialog = Object.assign(
  (props: React.ComponentProps<typeof KumoDialog>) => (
    <KumoDialog
      {...props}
      className={cn("max-h-[85dvh] overflow-hidden flex flex-col", props.className)}
    />
  ),
  KumoDialog
);
export default Dialog;
