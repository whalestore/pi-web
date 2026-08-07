"use client";

/**
 * ui/sidebar —— 侧边栏（Provider + 多子组件）（kumo 标准）
 *
 * @example
 * <SidebarProvider><Sidebar>...</Sidebar></SidebarProvider>
 */
import {
  Sidebar as KumoSidebar,
  SidebarProvider as KumoSidebarProvider,
} from "@cloudflare/kumo/components/sidebar";

export const SidebarProvider = KumoSidebarProvider;
export const Sidebar = KumoSidebar;
export default SidebarProvider;
