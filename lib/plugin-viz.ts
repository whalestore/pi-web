/**
 * 插件可视化配置 —— 读写 pi-subagents 的配置
 *
 * 两个配置源：
 * 1. 扩展级：~/.pi/agent/extensions/subagent/config.json（行为/UI/存储）
 * 2. 设置级：~/.pi/agent/settings.json → subagents 键（模型/角色/Watchdog）
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import os from "node:os";
import { writePrivateFileAtomicSync } from "./atomic-file";

const HOME = os.homedir();

export const SUBAGENT_CONFIG_PATH = join(
  HOME,
  ".pi",
  "agent",
  "extensions",
  "subagent",
  "config.json"
);
export const PI_SETTINGS_PATH = join(HOME, ".pi", "agent", "settings.json");

export interface SubagentsVizData {
  /** config.json 内容（扩展级配置） */
  configJson: Record<string, unknown>;
  /** settings.json 的 subagents 键内容 */
  settingsSubagents: Record<string, unknown>;
}

function readJsonSafe(path: string): Record<string, unknown> | null {
  try {
    if (!existsSync(path)) return null;
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** 读取完整可视化数据（GET /api/plugin-viz/subagents） */
export function readSubagentsVizData(): SubagentsVizData {
  const configJson = readJsonSafe(SUBAGENT_CONFIG_PATH) ?? {};
  const settings = readJsonSafe(PI_SETTINGS_PATH) ?? {};
  const settingsSubagents =
    settings.subagents && typeof settings.subagents === "object"
      ? (settings.subagents as Record<string, unknown>)
      : {};
  return { configJson, settingsSubagents };
}

/** 写入 config.json（原子替换，保留未涉及的键） */
export function writeConfigJson(patch: Record<string, unknown>): void {
  const current = readJsonSafe(SUBAGENT_CONFIG_PATH) ?? {};
  const next = { ...current, ...patch };
  mkdirSync(dirname(SUBAGENT_CONFIG_PATH), { recursive: true });
  writePrivateFileAtomicSync(SUBAGENT_CONFIG_PATH, JSON.stringify(next, null, 2) + "\n");
}

/** 写入 settings.json 的 subagents 键（保留 settings.json 其他键与 subagents 内未涉及的键） */
export function writeSettingsSubagents(patch: Record<string, unknown>): void {
  const current = readJsonSafe(PI_SETTINGS_PATH) ?? {};
  const currentSubagents =
    current.subagents && typeof current.subagents === "object"
      ? (current.subagents as Record<string, unknown>)
      : {};
  const next = {
    ...current,
    subagents: { ...currentSubagents, ...patch },
  };
  writePrivateFileAtomicSync(PI_SETTINGS_PATH, JSON.stringify(next, null, 2) + "\n");
}

/** 保存可视化数据（PUT /api/plugin-viz/subagents） */
export function saveSubagentsVizData(
  patch: Partial<SubagentsVizData>
): SubagentsVizData {
  if (patch.configJson) writeConfigJson(patch.configJson);
  if (patch.settingsSubagents) writeSettingsSubagents(patch.settingsSubagents);
  return readSubagentsVizData();
}
