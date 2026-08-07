"use client";

/**
 * ui/tooltip —— 悬停提示（kumo 标准）
 *
 * @example
 * <TooltipProvider>
  <Tooltip title="说明内容">
    <Button variant="secondary">悬停我</Button>
  </Tooltip>
</TooltipProvider>
 */
import {
  Tooltip as KumoTooltip,
  TooltipProvider as KumoTooltipProvider,
} from "@cloudflare/kumo/components/tooltip";

export const Tooltip = KumoTooltip;
export const TooltipProvider = KumoTooltipProvider;
export default Tooltip;
