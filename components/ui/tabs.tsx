"use client";

/**
 * ui/tabs —— 选项卡（数据驱动，segmented 分段 / underline 下划线）
 *
 * @example
 * <Tabs
 *   variant="underline"
 *   tabs={[
 *     { value: "detail", label: "插件详情" },
 *     { value: "viz", label: "可视化配置" },
 *   ]}
 *   value={tab}
 *   onValueChange={setTab}
 * />
 */
import { Tabs as KumoTabs, type TabsProps as KumoTabsProps } from "@cloudflare/kumo/components/tabs";

export type TabsProps = KumoTabsProps;

export const Tabs = KumoTabs;
export default Tabs;
