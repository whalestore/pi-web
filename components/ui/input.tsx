"use client";

/**
 * ui/input —— 文本/数字输入框
 *
 * @example
 * <Input value={...} onChange={...} placeholder="provider/model-id" />
 * <Input type="number" value={2} />
 */
import { Input as KumoInput, type InputProps as KumoInputProps } from "@cloudflare/kumo/components/input";

export type InputProps = KumoInputProps;

export const Input = KumoInput;
export default Input;
