# 项目知识库

**生成时间：** 2026-07-05 **提交：** e0b38cd（灵力核心重构版） **分支：** feat/lingli-core-refactor

## 项目概述

SillyTavern（酒馆助手）前端界面/脚本编写模板。`src/` 和 `示例/` 中每个文件夹是一个独立项目：

- 含 `index.ts` + `index.html` → **前端界面**（iframe 前台渲染）
- 仅含 `index.ts` → **脚本**（iframe 后台运行）

MVU 角色卡结构：`schema.ts`（Zod 4 变量定义）+ `脚本/` + `界面/` + `世界书/`

## 目录结构

```
tavern_helper_template-main/
├── src/                              # 主项目（MVU 角色卡）
│   └── 银月脉纪_荒野篇/              # 生存 RPG 角色卡（完整 MVU 实现）
├── 示例/                             # 示例项目（不要删除，AI 需要参考）
│   ├── 角色卡示例/                   # MVU 角色卡示例
│   ├── 脚本示例/                     # 脚本功能演示
│   ├── 前端界面示例/                 # 前端界面功能演示
│   └── 流式楼层界面示例/             # 流式楼层界面演示
├── 初始模板/                         # 新项目模板
├── @types/                           # 酒馆助手接口类型定义
│   ├── function/                     # 高层接口（推荐使用）
│   └── iframe/                       # 底层接口
├── util/                             # 工具函数库
│   ├── common.ts                     # 通用工具（解析、合并、校验）
│   ├── script.ts                     # 脚本工具（加载、卸载、样式隔离）
│   ├── mvu.ts                        # MVU 数据存储（2s 轮询 + 双向同步）
│   └── streaming.ts                  # 流式楼层界面挂载
├── _localtest/                       # 本地测试
│   ├── harness.mjs                   # Mock 环境
│   ├── engine.test.mjs               # 脚本引擎测试（12 项）
│   ├── schema.test.mjs               # Schema 测试（16 项）
│   ├── integration.test.mjs          # 集成测试（5 项）
│   └── fixtures/real_save.json       # 玩家真实存档（兼容性基准）
└── .cursor/rules/                    # 编码规则
```

## 任务速查

| Task              | Location                                     | Notes                              |
| ----------------- | -------------------------------------------- | ---------------------------------- |
| 新建前端界面/脚本 | `初始模板/*/新建为src文件夹中的文件夹/`      | 复制到 src/ 重命名                 |
| 参考前端界面写法  | `示例/前端界面示例/`                         | Vue 3 + Pinia + vue-router         |
| 参考脚本写法      | `示例/脚本示例/`                             | jQuery + 酒馆助手接口              |
| 参考流式楼层界面  | `示例/流式楼层界面示例/`                     | mountStreamingMessages             |
| 参考 MVU 角色卡   | `示例/角色卡示例/` 或 `src/银月脉纪_荒野篇/` | schema.ts + 脚本 + 界面            |
| 查找酒馆助手接口  | `@types/function/`                           | 高层接口，直接调用                 |
| 查看 MVU 工具     | `util/mvu.ts`                                | defineMvuDataStore                 |
| 运行测试          | `_localtest/`                                | pnpm test                          |
| 打包角色卡        | `tavern_sync.yaml`                           | node tavern_sync.mjs bundle <名称> |

## 代码地图

| Symbol                   | Type        | Location                        | Role                                     |
| ------------------------ | ----------- | ------------------------------- | ---------------------------------------- |
| `defineMvuDataStore`     | 函数        | `util/mvu.ts`                   | MVU 变量读写（2s 轮询 + watchIgnorable） |
| `mountStreamingMessages` | 函数        | `util/streaming.ts`             | 流式楼层界面挂载                         |
| `Schema`                 | Zod 对象    | `src/银月脉纪_荒野篇/schema.ts` | 角色卡变量结构定义                       |
| `POS_CAPS`               | 常量        | `src/银月脉纪_荒野篇/schema.ts` | 位置容量表（单一数据源）                 |
| `POS_ICONS`              | 常量        | `src/银月脉纪_荒野篇/schema.ts` | 位置图标映射                             |
| `useDataStore`           | Pinia store | `示例/角色卡示例/界面/store.ts` | 角色卡数据存储示例                       |
| `harness`                | 测试工具    | `_localtest/harness.mjs`        | Mock 环境（事件总线、变量、Mvu）         |

## 编码约定

- **Zod 4**（非 3.x！）：`z` 全局可用，`_`（lodash）全局可用
- **`$` 前缀字段**：schema transform 派生，AI 不可写
- **Schema 只新增/放宽**：绝不删字段或改名（存档兼容）
- **`prefault` 而非 `default`**：Zod 默认值用 `z.prefault()`
- **`store.data` 路径**：组件写 `_.set(store.data, 'xxx', yyy)`，不是 `store.data.stat_data.xxx`
- **加载/卸载**：用 `$(() => { ... })` 加载，`$(window).on('pagehide', ...)` 卸载
- **禁止 `DOMContentLoaded`**：iframe 加载时机不触发该事件
- **禁止 `vh`/`vw` 单位**：iframe 视口不稳定
- **`position:fixed` 锚定**：锚定到整个 iframe 文档
- **优先酒馆助手接口**：用 `@types/function/` 而非 `@types/iframe/exported.sillytavern.d.ts`

## 禁止模式（本项目）

- ❌ `as any` / `@ts-ignore` / `@ts-expect-error`（类型安全）
- ❌ `z.default()`（用 `z.prefault()`）
- ❌ 删除或重命名 schema 字段（存档兼容）
- ❌ 手动输出 `$` 开头字段（schema transform 自动算）
- ❌ `DOMContentLoaded` 事件（iframe 不触发）
- ❌ `vh`/`vw` 单位（iframe 视口问题）
- ❌ `window.parent.$`（脚本中用 `window.$ = window.parent.$`）
- ❌ 循环依赖（`import-x/no-cycle` 为 error）

## 项目特色

- **中文目录和文件名**：项目特色，非技术债
- **单文件 HTML 输出**：webpack 将 JS/CSS 全部内联到 HTML
- **CDN 外部依赖**：jQuery、lodash、toastr、YAML、zod 等通过 jsDelivr 加载
- **socket.io 热重载**：pnpm watch 启动端口 6621，酒馆自动连接
- **Schema 自动生成 JSON**：pnpm dump / watch 时自动转换
- **dist/ 提交到仓库**：通过 jsDelivr CDN 分发

## 常用命令

```bash
pnpm build            # webpack 生产构建 → dist/
pnpm build:dev        # webpack 开发构建
pnpm watch            # 开发监听 + 热重载（配合酒馆"实时监听"开关）
pnpm lint             # eslint
pnpm lint:fix         # eslint --fix
pnpm format           # prettier
pnpm test             # 本地测试（node _localtest/run-all.mjs）
pnpm dump             # schema.ts → schema.json
node tavern_sync.mjs bundle <配置名称>   # 打包角色卡为 PNG
```

## 路径别名

- `@/*` → `./src/*`
- `@util/*` → `./util/*`

## 全局变量（无需导入）

- `$`（jQuery）、`_`（lodash）、`toastr`、`YAML`、`z`（Zod 4）
- `@types/` 文件夹中的酒馆助手接口均可直接调用，无需导入

## 自动导入（unplugin）

Vue 3、Pinia、`@vueuse/core`、`dedent`、`klona`、`z`、`useModal` 等已配置自动导入，无需手动 import。Vue 组件也通过
`unplugin-vue-components` 自动注册。

## 构建系统

**Webpack 5** + TypeScript（v6.0.0-dev nightly）

- 入口自动发现：`{示例,src}/**/index.{ts,tsx,js,jsx}`
- 单文件输出：`LimitChunkCountPlugin({ maxChunks: 1 })`
- HTML 内联：`HtmlWebpackPlugin` + `HtmlInlineScriptWebpackPlugin` + `HTMLInlineCSSWebpackPlugin`
- 代码混淆：`@obfuscate` 注释启用
- CI 排除：`@no-ci` 注释排除

## 测试

```
pnpm test   # → node _localtest/run-all.mjs（33 项测试）
```

三组测试：

- `engine.test.mjs`（脚本引擎 12 项）
- `schema.test.mjs`（Schema 16 项，需 npx tsx）
- `integration.test.mjs`（集成 5 项）

新功能需配套测试。`baseData()` 提供最小 stat_data，`boot()` 返回 harness，`h.fire({stat_data})` 触发脚本。

## 代码风格

- Prettier：单引号、120 字符宽、尾逗号、2 空格缩进、LF 换行
- ESLint + Prettier 配合；`@typescript-eslint/no-explicit-any` 关闭
- `import-x/no-cycle` 为 error，注意循环依赖

## CDN 更新流程

改代码 → commit → `git log --oneline -1` 取 hash → 更新 `index.yaml` 中 `@旧hash` → `node tavern_sync.mjs bundle <名称>`
→ commit → push

## 参考文件

- `.cursor/rules/`：项目基本概念、前端界面、脚本、MVU 变量框架、MVU 角色卡、酒馆变量、酒馆助手接口、MCP
- `HANDOFF.md`：银月脉纪_荒野篇的完整交接文档（架构、schema、脚本逻辑、测试）
- `@types/`：酒馆助手接口类型定义
- `slash_command.txt`：STScript 命令列表
