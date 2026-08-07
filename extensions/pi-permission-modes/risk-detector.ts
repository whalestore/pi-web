// Risk detector for `risky` mode: heuristic checks for dangerous bash
// commands, sensitive/out-of-project file writes, and outbound network
// requests. This is a heuristic gate, not a sandbox — same trust model as
// Codex's "ask for permission on risky operations".

import { isAbsolute, resolve, sep } from "node:path";

export interface RiskInfo {
  risky: boolean;
  reasons: string[];
}

const NO_RISK: RiskInfo = { risky: false, reasons: [] };

// ---------- bash ----------

const DESTRUCTIVE_PATTERNS: Array<[RegExp, string]> = [
  [/rm\s+-(?:[a-z]*r[a-z]*f|[a-z]*f[a-z]*r|rf\S*)\s+(?:\/|\*|\/\*)/i, "递归强制删除根目录"],
  [/rm\s+-[a-z]*rf[a-z]*\s+/i, "rm -rf 危险删除"],
  [/mkfs(?:\.\w+)?\s/, "格式化文件系统"],
  [/dd\s+.*of=\/dev\//, "直接写设备文件"],
  [/shutdown\s+/, "关机命令"],
  [/reboot\s*$/, "重启命令"],
  [/halt\s*$/, "停机命令"],
  [/:\s*\(\)\s*\{/, "fork 炸弹"],
  [/chmod\s+-R\s+777\s+\//, "递归提权根目录"],
  [/chown\s+-R\s+.*\s+\//, "递归变更根目录属主"],
  [/>\s*\/dev\/(?:sda|sdb|disk)/, "写入磁盘设备"],
];

const PRIVILEGE_PATTERNS: Array<[RegExp, string]> = [
  [/(^|[\s|;&])sudo\s+/, "sudo 提权"],
  [/passwd\s/, "修改密码"],
  [/kill\s+-9\s+\d+/, "强制杀进程"],
  [/systemctl\s+(?:stop|disable|mask)\s+/, "停用系统服务"],
];

const SECRET_PATTERNS = /\b(ghp_|github_pat_|sk-[A-Za-z0-9]|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|xox[baprs]-|Bearer\s+[A-Za-z0-9._-]{20,}|api[_-]?key\s*[=:]\s*['\"]?[A-Za-z0-9_-]{16,})/i;

const NETWORK_WRITE_RE = /\b(curl|wget)\b.*?(\s-(?:[a-z]*d|T|u|X|data|upload-file|form|request)|--data|--upload|--form|--request\s+(?:POST|PUT|PATCH))/i;
const NETWORK_HOST_RE = /(?:https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?::\d+)?/i;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export function detectBashRisk(command: string): RiskInfo {
  const reasons: string[] = [];

  for (const [re, label] of DESTRUCTIVE_PATTERNS) {
    if (re.test(command)) reasons.push(`危险命令（${label}）`);
  }
  for (const [re, label] of PRIVILEGE_PATTERNS) {
    if (re.test(command)) reasons.push(`提权操作（${label}）`);
  }

  if (SECRET_PATTERNS.test(command) && NETWORK_WRITE_RE.test(command)) {
    reasons.push("命令中疑似包含密钥且外发网络请求");
  } else if (SECRET_PATTERNS.test(command)) {
    reasons.push("命令中疑似包含密钥/token");
  }

  if (NETWORK_WRITE_RE.test(command)) {
    const hostMatch = NETWORK_HOST_RE.exec(command);
    const host = hostMatch?.[1]?.toLowerCase();
    if (host && !LOCAL_HOSTS.has(host)) {
      reasons.push(`网络写操作（上传数据到 ${host}）`);
    } else if (!host) {
      reasons.push("网络写操作（检测到上传类参数）");
    }
  }

  return reasons.length ? { risky: true, reasons } : NO_RISK;
}

// ---------- paths (write / edit) ----------

const SENSITIVE_NAME_RE = /(^|[\\/.])(\.env(?:\.[\w.-]+)?|\.env\.local|id_rsa|id_ed25519|\.pem$|\.key$|\.p12$|\.pfx$|\.npmrc|\.netrc|\.aws[/\\]|\.ssh[/\\]|\.gnupg[/\\]|auth\.json|credentials|secret|token)/i;
const PROTECTED_DIR_RE = /(^|[\\/])(node_modules|\.git|\.next|dist|build)([\\/]|$)/;

export function detectPathRisk(filePath: string, cwd: string): RiskInfo {
  const reasons: string[] = [];

  const abs = isAbsolute(filePath) ? resolve(filePath) : resolve(cwd, filePath);
  const root = resolve(cwd);

  if (abs !== root && !abs.startsWith(root + sep)) {
    reasons.push("编辑外部文件（项目根之外）");
  }
  if (SENSITIVE_NAME_RE.test(abs)) {
    reasons.push("写入敏感路径（密钥/凭据类文件）");
  }
  if (PROTECTED_DIR_RE.test(abs)) {
    reasons.push("写入受保护目录（依赖/构建产物/版本库）");
  }

  return reasons.length ? { risky: true, reasons } : NO_RISK;
}

// ---------- web ----------

export function detectWebRisk(target: string): RiskInfo {
  // read-only web lookups are not risky by themselves; only writes are.
  return NO_RISK;
}
