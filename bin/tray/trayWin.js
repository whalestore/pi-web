#!/usr/bin/env node
"use strict";

// Windows tray via PowerShell NotifyIcon — zero binary deps, AV-safe.
// IPC protocol (same as 9router):
//   Node → PS (stdin): {"action":"add-item"|"update-item"|"set-tooltip"|"kill", ...}
//   PS → Node (stdout): {"type":"click","index":N} / {"type":"started"|"error",...}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const readline = require("readline");

let psProcess = null;
let clickHandler = null;

function sendCommand(cmd) {
  if (psProcess && psProcess.stdin.writable) {
    psProcess.stdin.write(`${JSON.stringify(cmd)}\n`, "utf8");
  }
}

/**
 * Initialize Windows tray using PowerShell NotifyIcon.
 * @param {Object} options - { iconPath, tooltip, items, onClick }
 *   items: [{ title, enabled }]
 * @returns {Object|null} controller with updateItem/setTooltip/kill
 */
function initWinTray(options) {
  const { iconPath, tooltip, items, onClick } = options;
  clickHandler = onClick;

  const scriptPath = path.join(__dirname, "tray.ps1");

  try {
    psProcess = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-WindowStyle", "Hidden",
        "-InputFormat", "Text",
        "-OutputFormat", "Text",
        "-File", scriptPath,
        "-IconPath", iconPath,
        "-Tooltip", tooltip,
      ],
      { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
    );
  } catch {
    return null;
  }

  const rl = readline.createInterface({ input: psProcess.stdout });
  rl.on("line", (line) => {
    try {
      const evt = JSON.parse(line);
      if (evt.type === "click" && clickHandler) {
        clickHandler(evt.index);
      }
    } catch {}
  });

  psProcess.on("error", () => {});
  psProcess.stderr.on("data", () => {});

  items.forEach((item, index) => {
    sendCommand({ action: "add-item", index, title: item.title, enabled: item.enabled });
  });

  return {
    updateItem(index, title, enabled) {
      sendCommand({ action: "update-item", index, title, enabled });
    },
    setTooltip(text) {
      sendCommand({ action: "set-tooltip", text });
    },
    kill() {
      try {
        sendCommand({ action: "kill" });
      } catch {}
      setTimeout(() => {
        if (psProcess && !psProcess.killed) {
          try {
            psProcess.kill();
          } catch {}
        }
        psProcess = null;
      }, 300);
    },
  };
}

module.exports = { initWinTray };
