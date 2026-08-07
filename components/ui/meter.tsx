"use client";

/**
 * ui/meter —— 进度/度量条（kumo 标准）
 *
 * @example
 * <Meter value={68} max={100} label="使用率" />
 */
import { Meter as KumoMeter } from "@cloudflare/kumo/components/meter";

export const Meter = KumoMeter;
export default Meter;
