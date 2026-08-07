#!/usr/bin/env node
"use strict";

// Lazy-install systray2 for macOS/Linux into ~/.pi-web/runtime/node_modules.
// Windows uses a PowerShell NotifyIcon tray (no binary), so this is skipped.
//
// Rationale (same as 9router): shipping the unsigned Go tray binary inside the
// npm tarball triggers antivirus false positives and the legacy `systray` npm
// package (2017 x86_64 binary) is rejected by modern dyld on macOS 14+ /
// Apple Silicon. `systray2` is the maintained fork that works on modern OSes.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawnSync } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const os = require("os");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const SYSTRAY_PKG = "systray2";
const SYSTRAY_VERSION = "2.1.4";

function getRuntimeDir() {
  return path.join(os.homedir(), ".pi-web", "runtime");
}

function getRuntimeNodeModules() {
  return path.join(getRuntimeDir(), "node_modules");
}

function hasSystray() {
  return fs.existsSync(path.join(getRuntimeNodeModules(), SYSTRAY_PKG, "package.json"));
}

function chmodSystrayBin() {
  if (process.platform === "win32") return;
  const binName = process.platform === "darwin" ? "tray_darwin_release" : "tray_linux_release";
  const binPath = path.join(getRuntimeNodeModules(), SYSTRAY_PKG, "traybin", binName);
  if (!fs.existsSync(binPath)) return;
  try {
    fs.chmodSync(binPath, 0o755);
  } catch (e) {
    console.warn(`[pi-web][tray] chmod tray bin failed: ${e.message}`);
  }
}

function ensureRuntimeDir() {
  const dir = getRuntimeDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({ name: "pi-web-runtime", version: "1.0.0", private: true }, null, 2),
    );
  }
  return dir;
}

function npmInstall(pkgs) {
  const cwd = ensureRuntimeDir();
  console.log("⏳ Installing system tray (first run)...");
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const res = spawnSync(npmCmd, ["install", ...pkgs, "--no-save"], {
    cwd,
    encoding: "utf8",
    timeout: 120000,
  });
  if (res.status !== 0) {
    console.warn("⚠️  System tray install failed — tray disabled");
    console.warn(`   Reason: ${(res.stderr || res.stdout || "").split("\n").slice(-3).join("\n")}`);
    console.warn(`   Retry:  cd "${cwd}" && npm install ${pkgs.join(" ")}`);
    return false;
  }
  return true;
}

/**
 * Ensure systray2 is installed on macOS/Linux only.
 * Windows skips entirely (uses PowerShell NotifyIcon tray).
 * @returns {{ systray: boolean, skipped?: boolean }}
 */
function ensureTrayRuntime({ silent = false } = {}) {
  if (process.platform === "win32") {
    return { systray: false, skipped: true };
  }
  if (hasSystray()) {
    chmodSystrayBin();
    if (!silent) console.log("✅ System tray ready");
    return { systray: true };
  }
  const ok = npmInstall([`${SYSTRAY_PKG}@${SYSTRAY_VERSION}`]);
  if (ok) chmodSystrayBin();
  return { systray: ok && hasSystray() };
}

module.exports = { ensureTrayRuntime, getRuntimeNodeModules };
