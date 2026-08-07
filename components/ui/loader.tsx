"use client";

/**
 * ui/loader —— 加载指示器（kumo 标准）
 *
 * @example
 * <Loader size="sm" label="加载中…" />
 */
import {
  Loader as KumoLoader,
  SkeletonLine as KumoSkeletonLine,
} from "@cloudflare/kumo/components/loader";

export const Loader = KumoLoader;
export const SkeletonLine = KumoSkeletonLine;
export default Loader;
