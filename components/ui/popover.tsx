"use client";

/**
 * ui/popover —— 弹出浮层（kumo 标准）
 *
 * @example
 * <Popover.Root>
  <Popover.Trigger render={(p) => <Button {...p}>打开</Button>} />
  <Popover.Content>浮层内容</Popover.Content>
</Popover.Root>
 */
import { Popover as KumoPopover } from "@cloudflare/kumo/components/popover";

export const Popover = KumoPopover;
export default Popover;
