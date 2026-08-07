#!/usr/bin/env node
"use strict";

// System tray (menu bar / taskbar status icon) for pi-web.
//   macOS / Linux: systray2 (Go binary, lazy-installed by trayRuntime.js)
//   Windows:       PowerShell NotifyIcon (tray.ps1, zero binary deps)
// Menu: status → Open Dashboard → Auto-start toggle → Quit

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
const {
  isAutoStartEnabled,
  enableAutoStart,
  disableAutoStart,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("./autostart");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initWinTray } = require("./trayWin");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getRuntimeNodeModules } = require("./trayRuntime");

let trayInstance = null;
let isWinTray = false;

/**
 * Get icon base64 from file — used for systray (mac/linux)
 */
function getIconBase64() {
  const isWin = process.platform === "win32";
  const iconFile = isWin ? "icon.ico" : "icon.png";
  try {
    const iconPath = path.join(__dirname, iconFile);
    if (fs.existsSync(iconPath)) {
      return fs.readFileSync(iconPath).toString("base64");
    }
  } catch {}
  // Fallback: minimal blue dot icon (PNG)
  return "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFElEQVR42mNkYGD4z0AEYBxVSFUlAENBAuVVBqfIAAAAAElFTkSuQmCC";
}

/**
 * Check if system tray is supported on current OS
 * Supported: macOS, Windows, Linux (with GUI)
 */
function isTraySupported() {
  const platform = process.platform;
  if (!["darwin", "win32", "linux"].includes(platform)) {
    return false;
  }
  if (platform === "linux" && !process.env.DISPLAY) {
    return false;
  }
  return true;
}

/**
 * Initialize system tray with menu
 * @param {Object} options - { port, hostname, onQuit, onOpenDashboard }
 * @returns {Object|null} tray instance or null if not supported/failed
 */
function initTray(options) {
  if (!isTraySupported()) {
    return null;
  }

  // Windows uses PowerShell NotifyIcon (AV-safe), others use systray
  if (process.platform === "win32") {
    return initWindowsTray(options);
  }
  return initUnixTray(options);
}

/**
 * Build menu items array shared between platforms
 */
function buildMenuItems(port, autostartEnabled) {
  return [
    { title: `Pi Web (Port ${port})`, tooltip: "Server is running", enabled: false },
    { title: "Open Dashboard", tooltip: "Open in browser", enabled: true },
    {
      title: autostartEnabled ? "✓ Auto-start Enabled" : "Enable Auto-start",
      tooltip: "Run on OS startup",
      enabled: true,
    },
    { title: "Quit", tooltip: "Stop server and exit", enabled: true },
  ];
}

// Menu item indexes
const MENU_INDEX = { STATUS: 0, DASHBOARD: 1, AUTOSTART: 2, QUIT: 3 };

/**
 * Get current autostart state
 */
function getAutostartEnabled() {
  try {
    return isAutoStartEnabled();
  } catch {
    return false;
  }
}

/**
 * Handle menu item click (shared logic)
 */
function handleClick(index, options, onAutostartToggle) {
  const { onQuit, onOpenDashboard, port, hostname } = options;
  if (index === MENU_INDEX.DASHBOARD) {
    if (onOpenDashboard) onOpenDashboard();
    else openBrowser(`http://${hostname || "localhost"}:${port}/`);
  } else if (index === MENU_INDEX.AUTOSTART) {
    const enabled = getAutostartEnabled();
    try {
      if (enabled) disableAutoStart();
      else enableAutoStart(process.argv[1], port);
      onAutostartToggle(!enabled);
    } catch {}
  } else if (index === MENU_INDEX.QUIT) {
    console.log("\n👋 Shutting down...");
    if (onQuit) onQuit();
    killTray();
    setTimeout(() => process.exit(0), 500);
  }
}

/**
 * Windows tray via PowerShell NotifyIcon
 */
function initWindowsTray(options) {
  const { port } = options;
  try {
    const iconPath = path.join(__dirname, "icon.ico");
    const autostartEnabled = getAutostartEnabled();
    const items = buildMenuItems(port, autostartEnabled);

    trayInstance = initWinTray({
      iconPath,
      tooltip: `Pi Web - Port ${port}`,
      items,
      onClick: (index) => {
        handleClick(index, options, (newEnabled) => {
          const newTitle = newEnabled ? "✓ Auto-start Enabled" : "Enable Auto-start";
          trayInstance.updateItem(MENU_INDEX.AUTOSTART, newTitle, true);
        });
      },
    });

    isWinTray = true;
    return trayInstance;
  } catch {
    return null;
  }
}

/**
 * macOS/Linux tray via systray binary
 *
 * Prefers `systray2` (active fork of `systray`, ships newer
 * getlantern/systray-portable binaries that work on macOS 14+ and Apple
 * Silicon under Rosetta). Falls back to legacy `systray@1.0.5` if systray2
 * is not available.
 */
function resolveSystray() {
  let runtimeDir = null;
  try {
    runtimeDir = getRuntimeNodeModules();
  } catch {}

  // 1) systray2 in runtime dir (where ensureTrayRuntime installs it)
  if (runtimeDir) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return { mod: require(path.join(runtimeDir, "systray2")).default, isV2: true };
    } catch {}
  }
  // 2) systray2 resolvable from the package's own node_modules / NODE_PATH
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return { mod: require("systray2").default, isV2: true };
  } catch {}
  // 3) Legacy systray fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return { mod: require("systray").default, isV2: false };
  } catch {}
  if (runtimeDir) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return { mod: require(path.join(runtimeDir, "systray")).default, isV2: false };
    } catch {}
  }
  return null;
}

function chmodTrayBin(pkgName) {
  // systray2's npm tarball occasionally lands without +x on the bundled Go
  // binary (observed on macOS). spawn() then fails with EACCES.
  try {
    const binName = process.platform === "darwin" ? "tray_darwin_release" : "tray_linux_release";
    const candidates = [
      path.join(getRuntimeNodeModules(), pkgName, "traybin", binName),
      path.join(__dirname, "..", "..", "node_modules", pkgName, "traybin", binName),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) fs.chmodSync(p, 0o755);
    }
  } catch {}
}

function initUnixTray(options) {
  const { port } = options;
  try {
    const resolved = resolveSystray();
    if (!resolved) return null;
    const { mod: SysTray, isV2 } = resolved;

    chmodTrayBin(isV2 ? "systray2" : "systray");

    const autostartEnabled = getAutostartEnabled();
    const items = buildMenuItems(port, autostartEnabled);

    const menu = {
      icon: getIconBase64(),
      // Full-color RGBA logo — not a template icon (macOS template mode
      // would render it as a solid white square).
      isTemplateIcon: false,
      title: "",
      tooltip: `Pi Web - Port ${port}`,
      items,
    };

    trayInstance = new SysTray({ menu, debug: false, copyDir: true });
    isWinTray = false;

    trayInstance.onClick((action) => {
      handleClick(action.seq_id, options, (newEnabled) => {
        trayInstance.sendAction({
          type: "update-item",
          item: {
            title: newEnabled ? "✓ Auto-start Enabled" : "Enable Auto-start",
            tooltip: "Run on OS startup",
            enabled: true,
          },
          seq_id: MENU_INDEX.AUTOSTART,
        });
      });
    });

    if (isV2) {
      // systray2 exposes a ready() promise instead of onReady/onError.
      trayInstance.ready().catch((err) => {
        process.stderr.write(`[pi-web] tray failed to start: ${err && err.message ? err.message : err}\n`);
      });
    } else {
      trayInstance.onReady(() => {});
      trayInstance.onError(() => {});
    }

    return trayInstance;
  } catch (err) {
    process.stderr.write(`[pi-web] tray init error: ${err.message}\n`);
    return null;
  }
}

/**
 * Kill tray, wait Go binary fully exit (returns Promise).
 * Critical for hide-to-tray: macOS must release NSStatusItem before a new
 * tray spawns, otherwise the new icon silently fails to register.
 */
function killTray() {
  const instance = trayInstance;
  const wasWin = isWinTray;
  trayInstance = null;
  if (!instance) return Promise.resolve();

  if (wasWin) {
    try {
      instance.kill();
    } catch {}
    return Promise.resolve();
  }

  // Unix: get the Go tray child process handle.
  let proc = null;
  try {
    proc = instance._process || (typeof instance.process === "function" ? instance.process() : null);
  } catch {}

  // Graceful shutdown: send {type:"exit"} via IPC so the Go binary can call
  // systray.Quit() and release NSStatusItem. SIGKILL leaves a ghost icon on
  // the macOS menubar until logout, causing duplicate icons after re-spawn.
  const gracefulQuit = () => {
    try {
      instance.kill(true);
    } catch {}
  };
  const closeIpc = () => {
    try {
      instance.kill(false);
    } catch {}
  };

  if (!proc || !proc.pid) {
    gracefulQuit();
    closeIpc();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      closeIpc();
      resolve();
    };

    proc.once("exit", finish);
    gracefulQuit();

    // Escalate: SIGTERM after 800ms, SIGKILL after 1600ms if still alive.
    setTimeout(() => {
      try {
        process.kill(proc.pid, 0);
        proc.kill("SIGTERM");
      } catch {}
    }, 800);
    setTimeout(() => {
      try {
        process.kill(proc.pid, 0);
        proc.kill("SIGKILL");
      } catch {}
    }, 1600);

    // Fallback poll in case "exit" never fires (detached child, pipe closed)
    const deadline = Date.now() + 3000;
    const poll = setInterval(() => {
      try {
        process.kill(proc.pid, 0);
      } catch {
        clearInterval(poll);
        finish();
        return;
      }
      if (Date.now() > deadline) {
        clearInterval(poll);
        finish();
      }
    }, 50);
  });
}

/**
 * Open browser
 */
function openBrowser(url) {
  const platform = process.platform;
  let cmd;

  if (platform === "darwin") {
    cmd = `open "${url}"`;
  } else if (platform === "win32") {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  exec(cmd);
}

module.exports = { initTray, killTray, openBrowser };
