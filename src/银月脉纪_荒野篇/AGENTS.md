# 银月脉纪：荒野篇 — MVU 角色卡

## 项目概述

生存 RPG 角色卡。玩家扮演九尾白狐娘「晓光」，坠机后在荒野求生。Vue 3 + Pinia 前端 + Zod 4 schema + 酒馆助手 MVU 框架。

**详细交接文档**：`../../HANDOFF.md`（架构、schema、脚本逻辑、测试、initvar）

## 目录结构

```
银月脉纪_荒野篇/
├── schema.ts              ← Zod 4 变量结构（731 行，导出 Schema/POS_CAPS/POS_ICONS）
├── schema.json            ← 自动生成，勿手动编辑
├── index.yaml             ← 角色卡配置（世界书索引、脚本、正则、CDN 引用）
├── 第一条消息/0.txt       ← initvar 变量初始化块（唯一初始化数据源）
├── 脚本/
│   ├── 系统辅助/index.ts  ← 核心引擎：掷骰、时间推进、灵力衰减、XP 限流、伤病演化
│   ├── 变量结构/index.ts  ← schema 导入预设声明
│   ├── MVU/index.ts       ← MVU 框架 CDN 外链
│   └── 立即事件/index.ts
├── 界面/状态栏/
│   ├── store.ts           ← defineMvuDataStore（2s 轮询 + watchIgnorable）
│   ├── index.ts           ← 入口 + iframe polyfill（9 个构造器）
│   ├── App.vue            ← 主应用（SetupWizard + ChoiceModal + 各 Tab）
│   └── components/        ← 10 个子目录：home/status/inventory/world/camp/workshop/setup/shared/journal/layout
└── 世界书/
    ├── 系统/              ← 灵力/制作/探索/负载均衡/热力学/衣物防护/物理/生态等
    ├── 变量/              ← 变量更新规则/变量输出格式
    ├── 核心/
    ├── 数据模板/
    └── 条件事件/          ← 发情期等 NSFW 机制
```

## 任务速查

| Task           | Location                 | Notes                                         |
| -------------- | ------------------------ | --------------------------------------------- |
| 修改变量结构   | `schema.ts`              | Zod 4，只新增/放宽，绝不删字段                |
| 修改脚本逻辑   | `脚本/系统辅助/index.ts` | eventOn(VARIABLE_UPDATE_ENDED)                |
| 修改前端界面   | `界面/状态栏/`           | Vue 3 + Pinia + tailwindcss                   |
| 修改世界书     | `世界书/`                | YAML 格式                                     |
| 修改初始化变量 | `第一条消息/0.txt`       | 末尾 initvar 块                               |
| 修改角色卡配置 | `index.yaml`             | CDN 引用、世界书索引                          |
| 打包角色卡     | 根目录                   | `node tavern_sync.mjs bundle 银月脉纪_荒野篇` |
| 运行测试       | `_localtest/`            | `pnpm test`（33 项）                          |

## 编码约定

- **store.data 路径**：组件写 `_.set(store.data, 'xxx', yyy)`，store.data 已是 stat_data 根
- **`$` 前缀字段**：schema transform 派生，AI 不可写，脚本也不应输出
- **Schema 只新增/放宽**：绝不删字段或改名（存档兼容）
- **`prefault` 而非 `default`**：Zod 默认值用 `z.prefault()`
- **enum vs string**：系统逻辑需要的保留 enum（时段/天气/季节），描述性的改 string
- **全量变量输出**：AI 每轮按 7 组 replace 输出整份 stat_data，非增量
- **脚本事件顺序**：XP 限流 → 掷骰 → 时间推进（灵力衰减/代谢/伤病/陷阱）
- **Polyfill 必需**：index.ts 中 9 个 force-override（Element/HTMLElement/SVGElement 等）

## 禁止模式

- ❌ 手动输出 `$` 开头字段（schema transform 自动算）
- ❌ 删除或重命名 schema 字段（玩家存档会损坏）
- ❌ `store.data.stat_data.xxx`（应为 `store.data.xxx`）
- ❌ `z.default()`（用 `z.prefault()`）
- ❌ `updateVariablesWith` 直接写变量（除 setup.ts 初始 load 外，走 store.data）
- ❌ 前端 fallback 伪造值（用 `?? 0` 而非 `?? 78`）

## 关键符号

| Symbol          | Role                                       |
| --------------- | ------------------------------------------ |
| `Schema`        | Zod 4 顶层对象，定义 stat_data 全部字段    |
| `POS_CAPS`      | 位置容量表（舒适/绝对上限 kg），单一数据源 |
| `POS_ICONS`     | 位置 → 图标映射                            |
| `useDataStore`  | Pinia store，defineMvuDataStore 实例       |
| `xpThreshold()` | XP 升级阈值公式（100 × 1.15^(level-1)）    |
