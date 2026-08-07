#!/usr/bin/env node
"use strict";

// Auto-start on OS boot, used by the tray menu's "Auto-start" toggle.
// macOS: LaunchAgent plist · Windows: Startup .vbs (hidden window) · Linux: .desktop

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const os = require("os");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("child_process");

const APP_NAME = "pi-web";
const APP_LABEL = "com.pi-web.autostart";

/**
 * Resolve the absolute path to bin/pi-web.js.
 */
function getCliJsPath(cliPath) {
  if (cliPath) {
    const resolved = path.resolve(cliPath);
    if (fs.existsSync(resolved)) return resolved;
  }
  if (process.argv[1]) {
    const resolved = path.resolve(process.argv[1]);
    if (path.basename(resolved) === "pi-web.js" && fs.existsSync(resolved)) {
      return resolved;
    }
  }
  const computed = path.resolve(__dirname, "..", "pi-web.js");
  if (fs.existsSync(computed)) return computed;
  return null;
}

/**
 * Enable auto startup on OS boot.
 * @param {string} cliPath - Absolute path to bin/pi-web.js
 * @param {string|number} port - Port to run on when started at boot
 * @returns {boolean} success
 */
function enableAutoStart(cliPath, port) {
  const platform = process.platform;
  if (!["darwin", "win32", "linux"].includes(platform)) return false;
  if (platform === "linux" && !process.env.DISPLAY) return false;
  try {
    if (platform === "darwin") return enableMacOS(cliPath, port);
    if (platform === "win32") return enableWindows(cliPath, port);
    if (platform === "linux") return enableLinux(cliPath, port);
  } catch {
      // Silent fail — autostart is optional
}
  return false;
}

/**
 * Disable auto startup.
 * @returns {boolean} success
 */
function disableAutoStart() {
  const platform = process.platform;
  try {
    if (platform === "darwin") return disableMacOS();
    if (platform === "win32") return disableWindows();
    if (platform === "linux") return disableLinux();
  } catch {}
  return false;
}

/**
 * Check if autostart is enabled. On macOS both the plist file and the launchd
 * registration must be present, otherwise the menu would lie about the state.
 */
function isAutoStartEnabled() {
  const platform = process.platform;
  try {
    if (platform === "darwin") {
      const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${APP_LABEL}.plist`);
      if (!fs.existsSync(plistPath)) return false;
      try {
        execSync(`launchctl list ${APP_LABEL}`, { stdio: ["ignore", "ignore", "ignore"], timeout: 3000 });
        return true;
      } catch {
        return false;
      }
    } else if (platform === "win32") {
      const startupPath = path.join(
        process.env.APPDATA || "",
        "Microsoft",
        "Windows",
        "Start Menu",
        "Programs",
        "Startup",
        `${APP_NAME}.vbs`,
      );
      return fs.existsSync(startupPath);
    } else if (platform === "linux") {
      const desktopPath = path.join(os.homedir(), ".config", "autostart", `${APP_NAME}.desktop`);
      return fs.existsSync(desktopPath);
    }
  } catch {}
  return false;
}

// ============ macOS ============

/**
 * Returns true when the current Node process IS the running instance that
 * launchd is managing under our agent label. Prevents `launchctl unload` from
 * SIGTERM-ing the very process executing the menu click (which would make the
 * tray icon disappear instead of flipping the label).
 */
function isAgentSelfMacOS() {
  try {
    const output = execSync(`launchctl list ${APP_LABEL}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3000,
    });
    const match = output.match(/"PID"\s*=\s*(\d+)/);
    return !!(match && parseInt(match[1], 10) === process.pid);
  } catch {
        return false;
      }
}

function enableMacOS(cliPath, port) {
  const launchAgentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
  const plistPath = path.join(launchAgentsDir, `${APP_LABEL}.plist`);

  if (!fs.existsSync(launchAgentsDir)) {
    fs.mkdirSync(launchAgentsDir, { recursive: true });
  }

  const nodePath = process.execPath;
  const cliScript = getCliJsPath(cliPath);
  if (!cliScript) return false;

  const launchPath = `${path.dirname(nodePath)}:/usr/local/bin:/usr/bin:/bin`;

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${APP_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${cliScript}</string>
        <string>--port</string>
        <string>${port}</string>
        <string>--tray</string>
        <string>--no-open</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>${launchPath}</string>
        <key>PI_WEB_NO_OPEN</key>
        <string>1</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/tmp/pi-web.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/pi-web.err.log</string>
</dict>
</plist>`;

  fs.writeFileSync(plistPath, plistContent);

  if (isAgentSelfMacOS()) {
    return true;
  }

  try {
    execSync(`launchctl unload "${plistPath}"`, { stdio: "ignore" });
  } catch {}
  try {
    execSync(`launchctl load -w "${plistPath}"`, { stdio: "ignore" });
  } catch {
      // plist is on disk; launchd picks it up at next login even if load fails
}
  return true;
}

function disableMacOS() {
  const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${APP_LABEL}.plist`);
  if (!isAgentSelfMacOS()) {
    try {
      execSync(`launchctl unload "${plistPath}"`, { stdio: "ignore" });
    } catch {}
  }
  if (fs.existsSync(plistPath)) {
    fs.unlinkSync(plistPath);
  }
  return true;
}

// ============ Windows ============

function enableWindows(cliPath, port) {
  const startupDir = path.join(
    process.env.APPDATA || "",
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "Startup",
  );
  const vbsPath = path.join(startupDir, `${APP_NAME}.vbs`);
  if (!fs.existsSync(startupDir)) return false;

  const nodePath = process.execPath;
  const cliScript = getCliJsPath(cliPath);
  if (!cliScript) return false;

  const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """${nodePath}"" ""${cliScript}"" --port ${port} --tray --no-open", 0, False
`;
  fs.writeFileSync(vbsPath, vbsContent);
  return true;
}

function disableWindows() {
  const vbsPath = path.join(
    process.env.APPDATA || "",
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "Startup",
    `${APP_NAME}.vbs`,
  );
  if (fs.existsSync(vbsPath)) {
    fs.unlinkSync(vbsPath);
  }
  return true;
}

// ============ Linux ============

function enableLinux(cliPath, port) {
  const autostartDir = path.join(os.homedir(), ".config", "autostart");
  const desktopPath = path.join(autostartDir, `${APP_NAME}.desktop`);

  if (!fs.existsSync(autostartDir)) {
    try {
      fs.mkdirSync(autostartDir, { recursive: true });
    } catch {
        return false;
      }
  }

  const nodePath = process.execPath;
  const cliScript = getCliJsPath(cliPath);
  if (!cliScript) return false;

  const desktopContent = `[Desktop Entry]
Type=Application
Name=Pi Web
Comment=Pi Web server
Exec=${nodePath} ${cliScript} --port ${port} --tray --no-open
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
`;
  fs.writeFileSync(desktopPath, desktopContent);
  return true;
}

function disableLinux() {
  const desktopPath = path.join(os.homedir(), ".config", "autostart", `${APP_NAME}.desktop`);
  if (fs.existsSync(desktopPath)) {
    fs.unlinkSync(desktopPath);
  }
  return true;
}

module.exports = { enableAutoStart, disableAutoStart, isAutoStartEnabled };
