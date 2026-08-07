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

/**
 * ui/textarea —— 多行文本输入
 *
 * @example
 * <Textarea value={...} onChange={...} placeholder="多行内容" />
 */
import { Textarea as KumoTextarea } from "@cloudflare/kumo/components/input";

export const Textarea = KumoTextarea;
