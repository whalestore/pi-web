"use client";

/**
 * ui/switch —— 开关
 *
 * @example
 * <Switch checked={enabled} onCheckedChange={setEnabled} label="启用 FleetView" />
 */
import { Switch as KumoSwitch, type SwitchProps as KumoSwitchProps } from "@cloudflare/kumo/components/switch";

export type SwitchProps = KumoSwitchProps;

export const Switch = KumoSwitch;
export default Switch;
