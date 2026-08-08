import { NextResponse } from "next/server";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// 权限模式 API：读取/切换 pi-permission-modes 扩展的模式
// 配置文件：~/.pi/permission.json（与扩展一致）

const CONFIG_PATH = join(homedir(), ".pi", "permission.json");
const MODES = ["full", "ask", "risky", "readonly", "custom"];

interface PermissionFile {
  mode?: string;
  rules?: { allow?: string[]; ask?: string[]; deny?: string[] };
  defaultPolicy?: string;
  approvalTimeoutMs?: number;
}

function readConfig(): PermissionFile {
  try {
    if (!existsSync(CONFIG_PATH)) return {};
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as PermissionFile;
  } catch {
    return {};
  }
}

export async function GET() {
  const cfg = readConfig();
  return NextResponse.json({
    mode: MODES.includes(cfg.mode ?? "") ? cfg.mode : "full",
    rules: cfg.rules ?? { allow: [], ask: [], deny: [] },
    defaultPolicy: cfg.defaultPolicy ?? "allow",
    approvalTimeoutMs: cfg.approvalTimeoutMs ?? 60000,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { mode?: string } | null;
  const mode = body?.mode;
  if (!mode || !MODES.includes(mode)) {
    return NextResponse.json({ error: `mode 必须是 ${MODES.join(" / ")} 之一` }, { status: 400 });
  }
  const cfg = readConfig();
  const next = { ...cfg, mode };
  try {
    writeFileSync(CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`);
    return NextResponse.json({ ok: true, mode });
  } catch (e) {
    return NextResponse.json({ error: `写入配置失败: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
}
