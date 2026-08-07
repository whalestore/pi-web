"use client";

/**
 * ui/dropdown —— 下拉菜单（kumo 标准）
 *
 * @example
 * <DropdownMenu.Root>
  <DropdownMenu.Trigger render={(p) => <Button {...p}>菜单</Button>} />
  <DropdownMenu.Content>
    <DropdownMenu.Item>选项一</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
 */
import { DropdownMenu as KumoDropdownMenu } from "@cloudflare/kumo/components/dropdown";

export const DropdownMenu = KumoDropdownMenu;
export default DropdownMenu;
