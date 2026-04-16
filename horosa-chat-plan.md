# Horosa 本地命理 Chat 应用 — 详细方案 v2

> 基于 `horosa` MCP Server 的本地桌面应用：**按钮即可用** + 可选 Chat 增强 + 命盘可视化 + 本地存档。

---

## 1. 目标

- **MVP 优先无 LLM**：新建档案 → 选体系 → 一键排盘 → 渲染 → 入库，全程不依赖任何云端 Key。
- **Chat 作为增强层**：可选接入 LLM（Anthropic Claude / Google Gemini / OpenAI 兼容端点），自然语言驱动 MCP 工具。
- **本地存档**：人物档案、对话历史、命盘数据全部落本地 SQLite，可离线、可导出、可回溯。
- **多体系并存**：八字 / 紫微 / 西占 / 六爻 / 奇门 / 太乙 …；同一档案多盘共存，跨档案合盘比对。

---

## 2. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 壳 | **Tauri 2.x** | 包体小，Rust 后端原生 stdio 桥接 MCP |
| 前端 | **React 18 + Vite + TypeScript** | 生态成熟 |
| 样式 | **TailwindCSS + shadcn/ui** | 快速搭出干净 UI |
| 图表 | **CSS Grid + SVG（主）+ ECharts（仅西占/雷达）** | 命盘表格用原生最可控；只在极坐标星盘和五行雷达才上 ECharts |
| 存储 | **SQLite** via `tauri-plugin-sql` | 本地、零运维、可文件备份；可选 SQLCipher |
| 状态 | **Zustand** + **TanStack Query** | 轻量 |
| MCP 桥 | Tauri Sidecar 直接 spawn `python -m horosa`（或官方 CLI gateway），stdio JSON-RPC | 少一层 Node，少一份依赖 |
| LLM（可选） | **Provider 抽象层**：Anthropic / **Gemini** / OpenAI 兼容 | 用户自带 Key，任意切换 |
| 流式 | Tauri `event` | Chat 流式回复 |

---

## 3. 架构

```
┌───────────────────────────────────────────────────────────┐
│                     Tauri App (Webview)                    │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Sidebar  │  │  Chat Pane   │  │ Visualization Pane │   │
│  │ 档案/会话 │  │ （可选启用） │  │ 命盘/卦象/时间轴    │   │
│  └──────────┘  └──────────────┘  └────────────────────┘   │
└──────────────────────┬────────────────────────────────────┘
                       │ invoke / event
┌──────────────────────┴────────────────────────────────────┐
│                   Tauri Core (Rust)                        │
│  ┌─────────────┐   ┌───────────────────┐  ┌────────────┐  │
│  │ SQLite Repo │   │ LLM Provider 抽象 │  │ MCP Bridge │  │
│  │ (sqlx)      │   │ Anthropic/Gemini  │  │ (stdio)    │  │
│  │             │   │ /OpenAI-compat    │  │            │  │
│  └─────────────┘   └───────────────────┘  └─────┬──────┘  │
└────────────────────────────────────────────────┼──────────┘
                                                 │ stdio JSON-RPC
                                     ┌───────────┴───────────┐
                                     │   horosa MCP Server   │
                                     │   (python -m horosa)  │
                                     └───────────────────────┘
```

**两条数据通路：**
- **直调通路（MVP）**：UI 按钮 → Tauri 命令 → MCP Bridge → horosa 工具 → JSON 落库 → 渲染。
- **Chat 通路（增强）**：用户文本 → LLM Provider（带 horosa tool schema） → 工具调用决策 → MCP Bridge → 结果回灌 LLM → 流式输出 + 渲染。

---

## 4. 数据模型（SQLite）

```sql
CREATE TABLE profiles (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  gender       TEXT,                 -- 'M' | 'F' | 'X'
  birth_utc    TEXT NOT NULL,        -- ISO8601 UTC
  birth_local  TEXT NOT NULL,        -- 用户输入的本地时间
  tz_name      TEXT,                 -- IANA tz, e.g. 'Asia/Shanghai'
  tz_offset    INTEGER,              -- 分钟（缓存）
  lat          REAL,
  lon          REAL,
  location     TEXT,                 -- 人类可读地名
  true_solar   INTEGER DEFAULT 0,    -- 是否启用真太阳时
  notes        TEXT,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id           INTEGER PRIMARY KEY,
  profile_id   INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT,
  system_prompt TEXT,
  llm_provider TEXT,                 -- 'anthropic' | 'gemini' | 'openai' | NULL=未启用
  llm_model    TEXT,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT
);

CREATE TABLE messages (
  id           INTEGER PRIMARY KEY,
  session_id   INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,        -- 'user' | 'assistant' | 'tool'
  content      TEXT,                 -- markdown
  tool_name    TEXT,
  tool_input   TEXT,                 -- JSON
  tool_output  TEXT,                 -- JSON
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE charts (
  id            INTEGER PRIMARY KEY,
  profile_id    INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,       -- 'bazi' | 'ziwei' | 'astro_west' | 'liuyao' | ...
  params        TEXT NOT NULL,       -- 入参 JSON（原样保留）
  params_hash   TEXT NOT NULL,       -- canonical(JSON) 的 SHA256，用于去重
  payload       TEXT NOT NULL,       -- horosa 原始返回 JSON
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, kind, params_hash)
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE
);
CREATE TABLE profile_tags (
  profile_id INTEGER, tag_id INTEGER,
  PRIMARY KEY(profile_id, tag_id)
);
```

> **canonical 化规则**：对 params JSON 做递归键排序 + 去空白 + 数字归一，再 SHA256，避免键序差异导致重复入库。

---

## 5. MCP 工具路由

| 场景 | 策略 |
|---|---|
| UI 按钮（"排八字"） | **直接** 调原子工具 `horosa_cn_bazi_birth`（MVP 主路径） |
| 流年 / 大运 | `horosa_predict_decennials` / `horosa_predict_givenyear` |
| 西占本命 | `horosa_astro_chart` |
| 紫微 | `horosa_cn_ziwei_birth` |
| 六爻起卦 | `horosa_cn_sixyao` / `horosa_cn_gua_desc` |
| 自然语言 | Chat 通路下走 `horosa_dispatch`，由服务端识别意图 |
| 记忆层 | `horosa_memory_*` 作为可选二级缓存 |

---

## 6. LLM Provider 抽象（支持 Gemini）

Chat 层做成 **provider-agnostic**，只依赖一个 Trait：

```rust
#[async_trait]
pub trait LlmProvider: Send + Sync {
    async fn stream(
        &self,
        history: Vec<Message>,
        tools: Vec<ToolSchema>,        // 由 MCP list_tools 转换
        on_event: EventSink,            // text_delta / tool_use / tool_result
    ) -> Result<()>;
}
```

三家适配器各自负责"翻译"：

| Provider | 工具调用字段 | 流式协议 | 备注 |
|---|---|---|---|
| **Anthropic Claude** | `tools[].input_schema` + `tool_use` blocks | SSE | 推荐 Sonnet 4.6；开 Prompt Caching 把工具列表放缓存段 |
| **Google Gemini** | `tools[].functionDeclarations[].parameters`（OpenAPI 子集） | SSE / streamGenerateContent | 推荐 `gemini-2.5-pro` 或 `gemini-2.5-flash`；schema 必须是 OpenAPI 3.0 子集，需把 MCP 的 JSON Schema 做轻度转换（去掉 `$ref`、`oneOf` 之类不支持的字段） |
| **OpenAI 兼容** | `tools[].function.parameters` | SSE | 任意 OpenAI-compatible endpoint（DeepSeek、Qwen、本地 vLLM 都行） |

> **Gemini 注意点**：
> - `parameters` 不接受完整 JSON Schema，需做转换；horosa 工具大多是平的对象，转换基本是字段重命名。
> - 函数调用响应是 `functionCall { name, args }`，回灌时用 `functionResponse`。
> - 不支持 Anthropic 的 prompt caching，工具列表多时 token 成本高，可考虑只暴露当前体系相关的子集。

设置页：用户可以为每个 session 选 provider + model + 输入对应 API Key（存 OS Keychain）。

---

## 7. 页面与交互

### 7.1 主布局（三栏）

- **左栏 240px**：搜索 / 新建档案 / 档案列表 / 展开看 session
- **中栏 flex-1**：
  - **MVP 模式**：体系切换 tab + 一组操作按钮（排本命 / 今年运势 / 起卦 / 合盘）+ 结果摘要
  - **Chat 模式**：消息流 + 输入框 + 工具调用折叠卡
- **右栏 420px**：当前命盘可视化（tab 切换体系）+ 大运流年时间轴

### 7.2 关键组件

- `<BaziBoard />` — **CSS Grid**，四柱 + 十神 + 藏干 + 纳音
- `<ZiweiBoard />` — **CSS Grid 4×4 异形布局**，12 宫 + 主星/副星/四化标记
- `<AstroWheel />` — **ECharts 极坐标 + 自定义 series**，黄道十二宫 + 行星 + 宫位线 + 相位
- `<WuxingRadar />` — **ECharts 雷达**，五行能量
- `<GuaView />` — **纯 SVG**，六爻爻画 + 世应标记 + 变爻动效
- `<QimenGrid />` — **CSS Grid 3×3**
- `<Timeline />` — **横向滚动 SVG**，大运流年点击触发预测

### 7.3 生辰输入组件（重点）

- 地点输入：本地 city 数据库（offline，~1MB）→ 自动填 lat/lon/tz_name
- 时区：默认按 lat/lon 反查 IANA tz；用户可手动覆盖
- 真太阳时：开关切换，开启时按经度自动加减
- 历法：公历 / 农历互转（horosa 自带 `horosa_cn_nongli_time`）
- 校验：未知时辰、夏令时边界、闰月特别提示

---

## 8. 目录结构

```
horosa-chat/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── db.rs                 # sqlx repo + canonical hash
│   │   ├── mcp.rs                # stdio 桥（spawn python -m horosa）
│   │   ├── llm/
│   │   │   ├── mod.rs            # LlmProvider trait
│   │   │   ├── anthropic.rs
│   │   │   ├── gemini.rs
│   │   │   ├── openai.rs
│   │   │   └── schema.rs         # JSON Schema → OpenAPI 子集
│   │   ├── tz.rs                 # location → tz_name
│   │   └── commands.rs           # #[tauri::command]
│   ├── tauri.conf.json
│   └── Cargo.toml
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── chat/
│   │   ├── charts/               # BaziBoard / ZiweiBoard / AstroWheel ...
│   │   ├── profile/              # 生辰输入
│   │   └── layout/
│   ├── hooks/
│   ├── stores/
│   ├── lib/tauri.ts
│   └── types/horosa.ts
├── data/
│   └── cities.sqlite             # 离线城市/时区库
├── package.json
└── README.md
```

---

## 9. 里程碑（重排）

> 原则：先做出"按钮即可用"的 MVP（M1–M5），再叠 Chat（M6+）。

| # | 目标 | 预估 | 产物 |
|---|---|---|---|
| **M1** | 脚手架 + SQLite + MCP 桥 | 1.5d | Tauri + React 起步，能 spawn `python -m horosa` 并跑通 `tools/list` |
| **M2** | 档案管理 + 生辰输入 | 1d | profile CRUD，地点/时区/真太阳时齐全 |
| **M3** | 八字盘端到端 | 1d | 按钮 → `horosa_cn_bazi_birth` → 入库 → `<BaziBoard />` 渲染 |
| **M4** | 紫微盘 | 0.5d | `<ZiweiBoard />` 12 宫 |
| **M5** | 大运流年时间轴 | 1d | `<Timeline />` + 点击触发 `horosa_predict_*` |
| **— MVP 可发布 —** | 5d 内可用 | | |
| M6 | 西占星盘 | 2.5d | `<AstroWheel />` ECharts + 行星字体 + 相位线交叉判定 |
| M7 | 六爻 / 奇门 | 1d | `<GuaView />` + `<QimenGrid />` |
| M8 | LLM Provider 抽象 + Anthropic | 1d | Chat 模式 v1，自然语言驱动 horosa |
| M9 | Gemini + OpenAI 兼容适配 | 1d | Provider 切换、JSON Schema → OpenAPI 转换 |
| M10 | 导出（PNG / Markdown / JSON） | 0.5d | dom-to-image |
| M11 | 打磨：快捷键 / 主题 / 多档案对比 / SQLCipher | 1d | |

合计约 **12–13 天**，但 **5 天就能拿到可用 MVP**。

---

## 10. 关键实现片段

### 10.1 Canonical Hash（Rust）

```rust
fn canonical_hash(v: &Value) -> String {
    let mut buf = Vec::new();
    write_canonical(&mut buf, v); // 递归键排序 + 数字归一
    let digest = Sha256::digest(&buf);
    hex::encode(digest)
}
```

### 10.2 MCP stdio 桥（spawn Python）

```rust
let mut child = Command::new("python")
    .args(["-m", "horosa", "--stdio"])
    .stdin(Stdio::piped()).stdout(Stdio::piped())
    .spawn()?;
// 之后走标准 JSON-RPC 帧格式
```

### 10.3 Gemini 适配器要点

```rust
// JSON Schema → Gemini OpenAPI 子集
fn to_gemini_schema(s: &Value) -> Value {
    // 1. 去掉 $schema / $ref / definitions
    // 2. oneOf/anyOf → 折叠为 type: "string"（描述里说明）
    // 3. 保留 type / properties / required / enum / description
}

// 工具列表
let tools = json!([{
    "functionDeclarations": horosa_tools.iter().map(|t| json!({
        "name": t.name,
        "description": t.description,
        "parameters": to_gemini_schema(&t.input_schema),
    })).collect::<Vec<_>>()
}]);

// 调用：POST v1beta/models/{model}:streamGenerateContent
// 响应里 candidates[].content.parts[].functionCall { name, args }
// 回灌：role: "function", parts[{ functionResponse: { name, response } }]
```

### 10.4 八字盘最小版（CSS Grid，无 ECharts）

```tsx
export function BaziBoard({ data }: { data: BaziPayload }) {
  const pillars = ['年', '月', '日', '时'] as const;
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {pillars.map((label, i) => (
        <div key={label} className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">{label}柱</div>
          <div className="text-2xl font-bold">{data.gans[i]}</div>
          <div className="text-2xl">{data.zhis[i]}</div>
          <div className="text-xs mt-1">{data.shishen[i]}</div>
          <div className="text-xs opacity-60">{data.canggan[i].join(' ')}</div>
        </div>
      ))}
    </div>
  );
}
```

---

## 11. 风险与取舍

- **算法一致性**：前端只做纯渲染，所有计算以 horosa 返回为准。
- **Gemini schema 限制**：JSON Schema → OpenAPI 子集需要转换层，复杂 schema 可能丢精度；horosa 工具大多是平的对象，问题不大。
- **API Key 存储**：OS Keychain（`tauri-plugin-stronghold` 或 `keyring` crate）。
- **Python 依赖分发**：用户需本地装 Python + horosa；可在首次启动做引导脚本（`pip install horosa`），或打包 PyInstaller embedded runtime 作为 sidecar binary。
- **打包签名**：Windows 自签名（首次 SmartScreen 提示）；Mac 需 Apple Developer 账号（可选）。
- **隐私**：DB 放 `tauri::path::app_data_dir`，可选 SQLCipher 加密。

---

## 12. 下一步

- [ ] 确认 LLM 默认 provider（推荐：MVP 阶段不接，M8 起 Anthropic 优先，M9 加 Gemini）
- [ ] 决定 horosa 分发方式（系统 Python vs 嵌入式 PyInstaller sidecar）
- [ ] 按 M1 搭脚手架，跑通 `python -m horosa` 的 `tools/list`
- [ ] M3 端到端：新建档案 → 排八字 → 渲染 → 落库
