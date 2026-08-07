# pi-permission-modes

Codex 风格的权限门禁扩展：`full` / `ask` / `risky` / `readonly` / `custom` 五种模式，
支持 allow/ask/deny 规则表（`Tool(glob)` 语法）、风险检测、审批流与审计日志。

> 设计对齐 Codex CLI 的权限模式选择器（请求批准 / 仅风险操作 / 完全访问 / 自定义 config.toml）。

## 安装（本地扩展）

```bash
# 项目级安装（推荐开发期使用）
pi install ./extensions/pi-permission-modes -l

# 或直接临时加载
pi -e ./extensions/pi-permission-modes/index.ts
```

## 五种模式

| 模式 | 行为 |
|---|---|
| `full`（默认） | 完全访问，零拦截 |
| `ask` | 每次 write/edit/bash/联网工具调用都弹窗请求批准 |
| `risky` | 仅风险检测命中时弹窗（危险命令、敏感路径、外部文件、密钥外发） |
| `readonly` | 只读工具放行；写工具与非常规 bash 一律拒绝 |
| `custom` | 规则表驱动：deny > allow > ask，未命中走 `defaultPolicy`（默认 allow） |

## 配置文件

- 用户级：`~/.pi/permission.json`
- 项目级：`.pi/permission.json`（规则追加在用户规则之上）

```json
{
  "mode": "risky",
  "defaultPolicy": "allow",
  "approvalTimeoutMs": 60000,
  "rules": {
    "allow": ["Bash(git *)", "Read(**)"],
    "ask": ["Edit(**/.env)", "Web(**)"] ,
    "deny": ["Bash(rm *)", "Bash(sudo *)"]
  }
}
```

## 命令

```
/permission                  # 查看当前模式/规则/会话记忆
/permission <mode>           # 切换模式（full|ask|risky|readonly|custom）
/permission allow|ask|deny <Tool(pattern)>   # 动态加规则
/permission forget           # 清除会话审批记忆
/permission log              # 查看今日审计记录
```

## 审计

每次判定追加一行 JSON 到 `~/.pi/logs/permission-YYYY-MM-DD.log`。

## 规则语法

`Tool(pattern)`，pattern 为 glob（`*` 匹配任意字符含 `/`，`?` 单字符）。
工具名映射：`bash` / `write` / `edit` / `web`（web_search、fetch_content、source_check）。

优先级：**deny > allow > ask**；同级别更具体（更长字面量）的规则优先。

## 审批

- TUI：原生 `ctx.ui.select` 弹窗
- RPC（pi-web）：经 extension_ui_request 协议由宿主渲染（pi-web 原生弹窗 / 内嵌审批条）
- 超时（默认 60s）自动**拒绝**（fail-safe）
- "始终允许"仅在**当前会话**内记忆，`/permission forget` 清除

## 已知边界

- 拦截在工具层，不拦截 `ask_question`/`subagent` 等协作通道
- bash 启发式检测并非沙箱（与 Codex 相同的信任模型）
