"use client";

/**
 * ui/sensitive-input —— 敏感信息输入（掩码）（kumo 标准）
 *
 * @example
 * <SensitiveInput value={secret} onChange={...} />
 */
import { SensitiveInput as KumoSensitiveInput } from "@cloudflare/kumo/components/sensitive-input";

export const SensitiveInput = KumoSensitiveInput;
export default SensitiveInput;
