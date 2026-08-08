import { NextResponse } from "next/server";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

/** 可视化插件目录（visualizations/<plugin>/manifest.json 声明） */
const VIS_DIR = join(process.cwd(), "visualizations");

interface VizPluginInfo {
  /** manifest 声明的插件名（如 pi-subagents） */
  name: string;
  /** 插件源（如 npm:pi-subagents） */
  source: string;
}

/** GET /api/plugin-viz/index —— 已开发可视化的插件列表 */
export async function GET() {
  const plugins: VizPluginInfo[] = [];
  if (existsSync(VIS_DIR)) {
    for (const dir of readdirSync(VIS_DIR, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const manifestPath = join(VIS_DIR, dir.name, "manifest.json");
      if (!existsSync(manifestPath)) continue;
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        if (manifest?.name) {
          plugins.push({ name: manifest.name, source: manifest.source ?? "" });
        }
      } catch {
        // 忽略损坏的 manifest
      }
    }
  }
  return NextResponse.json({ plugins });
}
