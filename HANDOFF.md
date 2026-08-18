# 银月脉纪：荒野篇 — 完整交接文档
> 生成时间: 2026-06-26 22:25
> 上一 agent 模型: Claude Opus (GLM-5.2)
> 当前分支: `feat/lingli-core-refactor` (领先 master 2 个提交)
> PR: https://github.com/BaiMeou/tavern_helper_template/pull/1
> 本地测试: 33 项全绿 (脚本12 + schema16 + 集成5)
> 构建: 0 错

---

## 一、项目是什么

这是一个 **酒馆助手 (SillyTavern) MVU 角色卡**：`银月脉纪：荒野篇`。玩家扮演 14 岁九尾白狐娘「晓光」，坠机后在荒野求生的生存 RPG 世界引擎。

**技术栈**：
- Vue 3 + Pinia + webpack（前端界面）
- Zod 4.x schema + `.transform()` 派生字段（变量结构）
- 酒馆助手 MVU 框架（`@c1ae3a9` commit，CDN 加载）
- `tavern_sync.mjs` 打包工具（打包成 PNG 角色卡）
- 每条消息楼层有独立的 `stat_data` 变量

**打包命令**：
```bash
node tavern_sync.mjs bundle 银月脉纪_荒野篇   # → src/银月脉纪_荒野篇/银月脉纪_荒野篇.png
```

**测试命令**：
```bash
npm test   # → node _localtest/run-all.mjs（33 项测试）
```

**构建命令**：
```bash
npm run build   # webpack 编译前端 + 脚本 → dist/
```

---

## 二、仓库结构（关键文件）

```
D:\Desktop\tavern_helper_template-main\
├── src/银月脉纪_荒野篇/
│   ├── schema.ts                    ← Zod schema，定义 stat_data 全部字段
│   │                                  导出: Schema, POS_CAPS, POS_ICONS, Schema类型
│   ├── index.yaml                   ← 角色卡配置（世界书索引、脚本、正则、CDN引用）
│   ├── 银月脉纪_荒野篇.png           ← 最终打包产物（玩家导入用）
│   ├── 第一条消息/0.txt              ← 第一条消息 + initvar 变量初始化块
│   │
│   ├── 脚本/
│   │   └── 系统辅助/index.ts        ← 核心脚本：掷骰引擎、时间推进、灵力环境衰减、
│   │                                    XP限流、电量衰减、疾病伤口演化
│   │
│   ├── 界面/状态栏/
│   │   ├── store.ts                 ← defineMvuDataStore（2s轮询 + watchIgnorable）
│   │   ├── index.ts                 ← 入口 + iframe polyfill（9个构造器）
│   │   ├── App.vue                  ← 主应用（SetupWizard v-if + ChoiceModal + 各 Tab）
│   │   └── components/
│   │       ├── home/HomeView.vue    ← 首页：灵力条、体征、近况、操作日志、重置存档
│   │       ├── status/StatusGroup.vue ← 状态页：体征、属性、体温、营养、伤病、灵力详情
│   │       ├── status/VitalCard.vue ← 体征卡片
│   │       ├── status/StatDotBar.vue ← 属性点条
│   │       ├── status/WoundList.vue ← 伤口列表
│   │       ├── status/DiseaseList.vue ← 疾病列表
│   │       ├── inventory/InventoryGroup.vue ← 装备页：负重、物品栏、容器、衣物
│   │       ├── inventory/ItemCard.vue ← 物品卡片（拖拽移动位置）
│   │       ├── world/WorldGroup.vue ← 世界页：天气、地形、水文、天体、地标
│   │       ├── camp/CampGroup.vue   ← 营地页：庇护所、篝火、储水、食物
│   │       ├── workshop/WorkshopGroup.vue ← 工坊页：配方知识卡、陷阱、地点探索
│   │       ├── setup/SetupWizard.vue ← 初始化向导（属性分配+物品选择+安全上限计算）
│   │       ├── shared/ChoiceModal.vue ← 选择弹窗（拾取/行动双语义）
│   │       ├── shared/DetailFold.vue ← 可折叠详情
│   │       ├── shared/DataRow.vue   ← 数据行
│   │       ├── shared/Formula.vue   ← 公式说明
│   │       ├── shared/InfoI.vue     ← ⓘ 提示图标
│   │       └── shared/GlossaryOverlay.vue ← 术语解释悬浮窗
│   │
│   └── 世界书/
│       ├── 系统/
│       │   ├── 灵力系统.yaml        ← 【新增】灵力核心文档
│       │   ├── 前端交互系统.yaml     ← $前端选择/$前端操作/掷骰/制作/推进时段
│       │   ├── 制作系统.yaml         ← 配方解锁/物品制作(AI直接改物品栏)
│       │   ├── 探索系统.yaml         ← 搜刮(AI驱动弹窗)/地标/迷路
│       │   ├── 负载均衡系统.yaml     ← 位置容量/均衡度/灵力联动
│       │   ├── 热力学法则.yaml       ← 篝火辐射(已修正: 保暖×0.6)
│       │   ├── 衣物防护系统.yaml
│       │   ├── 物理法则.yaml
│       │   ├── 生态法则.yaml
│       │   ├── 微气候系统.yaml
│       │   ├── 天体导航系统.yaml
│       │   ├── 狩猎采集系统.yaml
│       │   ├── 手机助手系统.yaml
│       │   └── 前端交互系统.yaml
│       ├── 变量/
│       │   ├── 变量更新规则.yaml     ← 各字段更新规则(已加灵力/灵脉强度条目)
│       │   ├── 变量输出格式.yaml     ← 【已重写】全量输出(7组replace)
│       │   └── 变量列表.txt          ← 动态变量展示(模板宏)
│       └── 条件事件/                 ← 发情期等 NSFW 机制
│
├── _localtest/                      ← 本地测试工具
│   ├── harness.mjs                  ← Mock tavern globals (_, Math.random, Mvu等)
│   ├── engine.test.mjs              ← 脚本引擎测试 12 项
│   ├── schema.test.mjs              ← Schema 测试 16 项
│   ├── integration.test.mjs         ← 前端集成测试 5 项
│   ├── run-all.mjs                  ← 一键运行全部
│   └── fixtures/real_save.json      ← 玩家真实存档(兼容性基准)
│
├── dist/银月脉纪_荒野篇/             ← webpack 构建产物（前端JS/CSS + 脚本JS）
├── util/mvu.ts                      ← defineMvuDataStore 工具（2s轮询 + watchIgnorable）
└── .cursor/rules/                   ← 编码规则
```

---

## 三、schema.ts 核心变量结构

### 顶层结构（非 $ 字段，AI 可写）：
```
stat_data
├── 晓光
│   ├── 基础属性       { 体质, 敏捷, 智力, 意志, 感知 }  (z.enum 1-20, XP自动升级)
│   ├── 生存状态       { 饥饿, 口渴, 体温, 精力, 健康, 精神 }
│   ├── 属性成长       { 体质XP, 敏捷XP, 意志XP, 感知XP }
│   ├── 营养代谢       { 今日摄入, 体脂储备, 基础代谢率, 蛋白质平衡 }
│   ├── 伤口           { [name]: { 位置, 类型, 严重度, 愈合阶段, 感染风险, ... } }
│   ├── 疾病           { [name]: { 症状, 严重度, 阶段, 传染性, ... } }
│   ├── 疲劳           { 肌肉疲劳, 睡眠债务, 累积负荷(string) }
│   ├── 狐类特性       { 灵力环境(enum), 灵力值(number≥0无上限), 灵力峰值(自动), 狐尾湿度(enum), 九尾状态(enum) }
│   ├── 执念           { 状态(enum), 强度, 近期波动, 核心锚点 }
│   ├── 睡眠           { 上次睡眠时长, 睡眠债务, 睡眠质量(enum), 最近中断, 床铺类型(string) }
│   ├── 第六感         { 听觉预警(record), 嗅觉探测(record), 灵力感知(string), 视觉标记(string),
│   │                     威胁评估(string), 强度(string) }
│   ├── 生理状态       { 发情期(enum) }
│   └── (passthrough)  → transform 派生 $精神区间, $思维加速可用
│
├── 世界
│   ├── 时间           { 天数, 时段(enum), 天气(enum), 季节(enum), 月相(enum同步) }
│   ├── 地形           { 当前位置, 北/南/东/西方, 灵脉强度(string) }
│   ├── 地势           { 坡度(string), 地表类型(string), 路径质量(string), 迷路风险(enum) }
│   ├── 地标           { [name]: { 名称, 类型, 描述, 已探索, 方位, 距离 } }
│   ├── 天气详情       { 温度, 风速, 风向(enum), 湿度, 地表状况(string), 气压趋势(string), 光照明度(string), ... }
│   ├── 水文           { 溪流水位(string), 流速(string), 浑浊度(string), ... }
│   └── 天体           { 日出时分, 日落时分, 月相(enum), 可见星座, 夜间能见度(enum) }
│
├── 装备
│   ├── 负重           { 安全上限(prefault=9), 当前(由transform写回), 位置容量(record) }
│   ├── 物品栏         { [id]: { 名称, 分类, 重量, 位置, 描述, 耐久度, 数量, ... } }
│   ├── 容器           { [name]: { 容量, 当前容量, 内容物 } }
│   ├── 衣物           { [name]: { 名称, 当前层次(enum), 保暖值, 防风值, 防水性, 湿度, 破损度 } }
│   ├── 手持           string
│   └── 穿着           string
│
├── 工坊
│   ├── 配方           { [name]: { 已解锁, 所需材料, 所需工具, 效果描述, 制作耗时分钟, 所需智力, 产出物, ... } }
│   └── 陷阱           { [name]: { 类型, 位置, 状态(enum), 布置天数, 捕获物 } }
│
├── 图鉴             { 野兽, 草药, 足迹, 日志 }
├── 营地             { 庇护所(string类型), 篝火, 储水, 食物库存 }
├── 环境感知         { 声学, 气味 }
├── $待搜刮货舱       array（持久参考数据，非派生，兼容保留）
└── (passthrough)    → transform 派生 30+ 个 $ 字段
```

### Transform 派生字段（$ 开头，AI 不可写，schema 自动算）：
```
$精神区间, $思维加速可用,
$装备总重, $当前负重, $负重比, $负重速度修正, $移动速度总修正,
$狐尾裹身速度修正, $湿尾速度修正, $分布惩罚,
$失温风险等级, $总保暖值, $总防风值, $九尾裹身有效,
$体感温度, $风寒拉低, $衣物补偿, $庇护补偿, $火补偿, $散热速率,
$恢复倍率, $距失温阈值, $预计失温分钟,
$蛋白质需求, $水分流失,
$灵力缓冲系数, $灵力等级, $灵力满格参考
```

### 关键设计决策：
- **`z.string()` 替代 `z.enum()`**：描述性字段（庇护所类型、坡度、地表状况等）全部改为 string，AI 可写自由描述
- **严格 enum 保留位置**：系统逻辑需要的枚举（时间.时段、天气、季节、衣物层次等）仍为 enum
- **`.prefault()`**：每个字段都有默认值，空 parse 不报错
- **`.passthrough()`**：顶层有 passthrough，`$前端选择`/`$前端操作`/`$推进时段` 等触发器可透传
- **`.transform()`**：只追加 `$` 派生字段，不删除/修改输入数据（除月相同步外）

---

## 四、脚本核心逻辑（系统辅助/index.ts）

### 事件监听器：
```typescript
eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, handler)
// AI 每次更新变量后触发，handler 接收 (variables) 参数
// variables.stat_data 就是当前 stat_data（已应用 AI 的 JSONPatch）
```

### 四个 handler 按顺序执行：

1. **XP 限流**（第 65-87 行）
   - 比较 `属性成长.xxxXP` 与上一轮的值
   - 单轮增量 > 8 则截断到 8（防 AI 一次暴涨）
   - 首轮无基线时不拦截（已知设计权衡，有回归测试）

2. **掷骰引擎**（第 91-225 行）
   - 监听 `$掷骰请求`，类型：搜刮/狩猎/铃铛/饮生水/生火/攀爬
   - 搜刮：只产出每件物品的完好度判定（完好/少耐久/部分损坏/损坏），不自动入栏
   - 铃铛：d6 + 灵力环境修正（稀薄-2/正常0/充沛2），结果写 `$上次铃铛结果`
   - 结果写 `$上次掷骰` + `$前端操作` + `$近期操作`，然后清空 `$掷骰请求`

3. **时间与代谢推进**（第 231-末尾）
   - 监听 `$推进时段`，合法值：`次日`/`黄昏`/`夜晚`
   - **灵力环境衰减/恢复**：按 `世界.地形.灵脉强度` 给灵力值增减
     - 枯竭-8, 稀薄-3, 正常0, 丰沛+6, 灵脉交汇+12
     - 未知描述按正常处理（不惩罚AI自由描述）
     - 过夜额外有"休息回灵"：有庇护所+10, 无庇护所+2
   - `次日`：天数+1, 时段=清晨, 代谢结算, 睡眠恢复, 伤口愈合, 食物腐败, 篝火熄灭, 陷阱判定
   - `黄昏`/`夜晚`：单时段代谢消耗, 电子设备电量衰减(-2%)
   - 非法值：写 `$前端操作` 反馈
   - 最后清空 `$推进时段`

---

## 五、前端数据流

```
AI 输出 UpdateVariable 块
    ↓ MVU 框架应用 JSONPatch 到 variables.stat_data
    ↓
util/mvu.ts 的 2s 轮询检测到变化
    ↓ safeParse → _.isEqual(data.value, result.data)
    ↓ 如果不等 → data.value = result.data（Vue ref 赋值）
    ↓
watchIgnorable(data, ...) → updateVariablesWith → 写回 variables.stat_data
    ↓
各组件的 computed 属性从 store.data 读取 → Vue 模板渲染
```

### 关键注意事项：
- **setup.ts 中的 write 路径**：所有组件写 `_.set(store.data, 'xxx', yyy)`（不是 `_.set(store.data, 'stat_data.xxx', yyy)`，因为 store.data 已经是 stat_data 的根）
- **ChoiceModal 触发机制**（已修复）：
  - 挂载时检查滞留的 `$前端选择`
  - 监听 `JSON.stringify($前端选择)` 变化（绕过 _.isEqual 短路）
  - 800ms 主动轮询兜底
- **iframe 约束**：position:fixed 锚定到整个 iframe 文档，不用 vh 单位
- **Polyfill**：SillyTavern iframe 缺少 Element/HTMLElement/SVGElement/MathMLElement/Storage/Node/CharacterData/Text/DocumentFragment 全局变量

---

## 六、最近完成的 6 阶段重构

### 阶段2 — 去严格化 ✅
- `庇护所.类型`/`防水性`/`防风性`/`床铺类型`：enum → string
- `CampGroup.vue` 的 `isUnlocked` 接受任意非空非"无"的字符串
- 累积负荷/地势/天气详情/水文/第六感/环境感知：描述性 enum → string（共约 20 个）

### 阶段4 — 修真 bug ✅
- `StatusGroup.vue:14`：`t('当前位置')` 读 `世界.时间.当前位置`（不存在）→ 改读 `世界.地形.当前位置`
- `ChoiceModal.vue`：弹窗不弹根因是 `util/mvu.ts` 2s 轮询的 `_.isEqual` 短路。修复：挂载即查+JSON序列化watch+800ms轮询
- `ChoiceModal.vue`：新增双语义——`类型: '拾取'`（写物品栏）/ `'行动'`（只回传意图）
- `探索系统.yaml`：教 AI 移动后更新地标距离

### 阶段1 — 灵力核心系统 ✅
- **schema 新增**：`狐类特性.灵力值`(number≥0无上限)、`狐类特性.灵力峰值`(自动同步新高)、`世界.地形.灵脉强度`(string)
- **transform 新增**：`$灵力等级`(枯竭/稀薄/充盈/旺盛/全盛)、`$恢复倍率`(0.5+灵力值/100)、`$灵力缓冲系数`(clamp(1-灵力值/200,0,1))、`$灵力满格参考`(max(峰值,当前值,50))
- **灵力总开关**：负重惩罚×缓冲系数（200+归零）；散热×(0.6+0.4×系数)；恢复倍率连续
- **脚本**：时间推进按灵脉强度衰减/恢复灵力值；过夜休息回灵；灵力环境枚举按值回填
- **前端**：HomeView灵力条（动态满格+峰值标记+等级badge+恢复倍率）；StatusGroup灵力详情
- **世界书**：新增 `灵力系统.yaml`（核心定位/字段/灵脉/主动消耗量级/总开关规则）
- **initvar**：`灵力值:8`（低开局/艰难起步）、`灵脉强度:稀薄`

### 阶段3 — 工坊重构 ✅
- 删除脚本合成引擎（`$合成请求` handler, 原第 227-309 行）
- 搜刮骰子：移除自动入栏和 `$待搜刮货舱` 关联，只产出完好度判定供 AI 叙事
- `WorkshopGroup.vue`：删合成按钮+搜刮残骸按钮；配方改只读知识卡；加地点探索说明
- `制作系统.yaml`/`前端交互系统.yaml`：AI 直接改物品栏（扣材料/加产物），不走触发器

### 阶段5 — 全量变量输出 ✅
- `变量输出格式.yaml`：JSONPatch 增量 → 按顶层分组整体 replace（7 组：晓光/世界/装备/工坊/图鉴/营地/环境感知）
- AI 每轮重审每个字段，没变的照原样写回，防止增量遗忘
- `$` 派生字段不输出（schema transform 自动算），触发器按需 insert

### 附带修复 ✅
- 保暖系数文案 0.5→0.6（热力学法则.yaml + preview.html，与 schema 一致）
- `POS_CAPS` 三处重复合并为 schema 单源（`schema.ts` 导出 `POS_CAPS`/`POS_ICONS`，InventoryGroup/SetupWizard 导入）

---

## 七、initvar（第一条消息变量初始化）

位于 `src/银月脉纪_荒野篇/第一条消息/0.txt` 末尾。**这是唯一初始化数据源**。

关键起始值：
```yaml
晓光:
  基础属性: { 体质: 2, 敏捷: 2, 智力: 8, 意志: 4, 感知: 4 }
  生存状态: { 饥饿: 85, 口渴: 55, 体温: 36.8, 精力: 38, 健康: 78, 精神: 75 }
  狐类特性: { 灵力环境: 稀薄, 灵力值: 8, 灵力峰值: 8, 狐尾湿度: 干燥, 九尾状态: 合并一尾 }
  执念: { 状态: 稳固, 强度: 85, 核心锚点: 铃铛还在就还有家——主人一定在找晓光 }
  睡眠: { 床铺类型: 无, 睡眠债务: 4 }
世界:
  时间: { 天数: 0, 时段: 清晨, 天气: 阴 }
  地形: { 当前位置: 飞机残骸西侧——机身中部与驾驶舱之间, 灵脉强度: 稀薄 }
装备:
  物品栏: { 女式巫女服: {...}, 项圈铃铛: {...} }  # 巫女服保底
  负重: { }  # 安全上限不写死（prefault=9，SetupWizard 公式覆盖）
$已初始化: false  # SetupWizard 完成后写 true
```

标记顺序（重要！）：`<UpdateVariable><initvar>...</initvar></UpdateVariable>` 在 `<StatusPlaceHolderImpl/>` **之前**。

---

## 八、世界书条目结构（index.yaml）

```
条目:
├── 蓝灯组（核心常驻，每次对话必加载）
│   ├── 变量列表.txt
│   └── 前端界面系统
│
├── 绿灯组（按关键字激活，深度0/2/4）
│   ├── 系统: 灵力系统/负载均衡/制作/热力学/衣物防护/物理/生态/微气候/天体/狩猎/手机/前端交互/探索
│   ├── 变量: 变量更新规则/变量输出格式
│   ├── 条件事件: 晓光身体设定/昏倒判定/铃铛奇迹/受孕判定/精神危机
│   ├── 角色: 性格/记忆/说话习惯
│   └── 世界: 自然灾害/时间/天气
│
└── 正则
    ├── [不发送]去除变量更新（深度3，从提示词剥离AI的旧更新）
    ├── [不发送]去除状态占位符（深度3）
    ├── [折叠]变量更新中（显示折叠）
    └── [折叠]完整变量更新（显示折叠）
```

---

## 九、玩家真实存档兼容性

`_localtest/fixtures/real_save.json` 是玩家 30+ 轮的真实存档。3 个兼容性测试确保：
1. 存档能 `parse` 不报错
2. 庇护所类型保留（测试记录显示存档值是 `"无"`——AI 写的 "天然岩壁凹陷" 被旧 enum 拒绝）
3. 物品栏/图鉴/伤口数量保留

**核心原则**：schema 只新增/放宽字段，绝不删字段或改名 → 存档继续可用。

---

## 十、CDN 配置

`index.yaml` 中的前端和脚本通过 jsDelivr CDN 加载：
```
cdn.jsdelivr.net/gh/BaiMeou/tavern_helper_template@20b9083/dist/银月脉纪_荒野篇/...
```
- 前端界面：`index.html`（iframe 加载）
- 脚本（三个独立 entry）：
  - `脚本/变量结构/index.js`（导入 schema.ts → 预设声明）
  - `脚本/系统辅助/index.ts`（核心引擎，eventOn 处理器）
  - `脚本/MVU/index.js`（MVU 框架 CDN 外链）
  - `脚本/立即事件/index.js`

**CDN 更新流程**：改代码 → 提交 → 得到新 commit hash → 更新 index.yaml 中的 `@旧hash` → 重打包 PNG → 推送

---

## 十一、测试架构

```
_localtest/
├── harness.mjs           ← Mock 环境
│   makeHarness({seed})    创建 harness
│   loadScript(path, h)    加载 TS 脚本
│   h.fire({stat_data})    触发 VARIABLE_UPDATE_ENDED 事件
│   h.ready()              等待 init 完成
│
├── engine.test.mjs        ← 脚本引擎 12 项测试
│   - 黄昏/次日代谢推进
│   - 电量衰减（过夜/单时段/0电量防负）
│   - 非法推进值反馈
│   - XP 限流（第二轮截断/首轮不拦边界）
│   - 灵力环境衰减/恢复（丰沛回灵/枯竭掉灵/防负/未知强度按正常）
│
├── schema.test.mjs        ← Schema 16 项测试
│   - 空解析不产生剧情
│   - initvar 可解析 + 巫女服保底
│   - 派生计算（体感温度/当前负重/失温风险）
│   - initvar 与 prefault 属性初值一致
│   - 发情期字段存在
│   - 灵力字段+派生（灵力值默认20/峰值同步/等级/满格/恢复倍率/缓冲系数/灵脉强度）
│   - 安全上限 initvar 不写死
│   - 标记顺序
│   - 存档兼容（3 项）
│
├── integration.test.mjs   ← 集成 5 项测试
│   - store.data 写物品栏 → 进变量
│   - $前端操作 → AI 可读
│   - SetupWizard store.data 写法 → 同步生效
│   - 异类写法演示（stat_data 前缀数据错位）
│   - SetupWizard 修复后正确路径
│
└── run-all.mjs            ← 一键运行全部
```

---

## 十二、当前 Git 状态

```
分支: feat/lingli-core-refactor
提交: e0b38cd (CDN hash更新), 20b9083 (主体重构)
PR: https://github.com/BaiMeou/tavern_helper_template/pull/1
领先 master: 2 个提交

未追踪（用户垃圾文件，不影响）:
  .codex/config.toml
  dist/前端界面示例/, dist/流式楼层界面示例/, dist/脚本示例/, dist/角色卡示例/
  超级对话.txt
```

---

## 十三、编码规则（从 CLAUDE.md 和 .cursor/rules 提取）

### 关键约束
1. **酒馆助手前端界面**: Vue 3 + Pinia + webpack；`inject:'body'` HtmlWebpackPlugin 选项
2. **iframe 约束**: position:fixed 锚定到整个 iframe 文档，不用 vh/vw 单位
3. **Polyfill**: SillyTavern iframe 缺少全局变量，需要 force-override polyfill（已在 index.ts 中实现）
4. **变量写入统一**: 所有组件用 `_.set(store.data, 'xxx', yyy)`（store.data 已经是 stat_data 根）
5. **不要用 `updateVariablesWith`**: 除了 setup.ts 的初始 load 外，所有写入走 store.data
6. **前端 fallback 诚实值**: `?? 0` 而不是 `?? 78`（不伪造初始值）
7. **schema 只新增/放宽**: 绝不删字段或改名（存档兼容）
8. **$ 派生字段不手写**: AI 不应输出 $ 开头的字段（schema transform 自动算）
9. **enum vs string**: 系统逻辑需要的保留 enum（时段/天气/季节等），描述性的改 string

### CDN hash 更新流程
1. 改代码
2. `git commit`
3. `git log --oneline -1` → 拿新 hash
4. 更新 `index.yaml` 中所有 `@旧hash` → `@新hash`
5. `node tavern_sync.mjs bundle 银月脉纪_荒野篇`
6. `git add -u && git commit -m "更新CDN hash到xxx"`
7. `git push`

### 测试规范
- 新功能必须配套测试（`_localtest/engine.test.mjs` 或 `schema.test.mjs`）
- `baseData()` 函数提供最小可跑 stat_data
- `boot()` 返回 harness → `h.fire({stat_data})` 触发脚本
- `initvar` 在测试中从 `0.txt` 读取
- `realSave` 在测试中从 `fixtures/real_save.json` 读取

---

## 十四、已知问题 / 回归基线

1. **XP 限流首轮不拦截**: 首轮无 baseline 时大跳不被限流（设计权衡，有回归测试）
2. **$待搜刮货舱**: 已不驱动自动入栏，但保留兼容（玩家真实存档有该字段）
3. **合成引擎已删**: `$合成请求` 触发器不存在了，AI 直接改物品栏
4. **全量输出对 AI 要求高**: AI 每轮要写 7 个 replace，漏写某组会清空该组字段
5. **CDN 缓存延迟**: PR 合并后 jsDelivr 可能需要几分钟传播
6. **灵力起始值 8**: 低开局（"艰难起步"），`$灵力等级` = "枯竭"

---

## 十五、下一步可能的工作

如果你想继续改进，以下是可能的方向：

1. **全量输出兜底脚本**: 如果 AI 实测漏写导致字段清空，可在脚本中加 "保留上轮字段" 的 fallback（但玩家最初要求"只靠世界书要求、不加脚本兜底"）
2. **灵力 UI 动画**: 灵力条目前是纯 CSS，可以加灵力光效动画
3. **存档迁移脚本**: 如果需要给现有玩家自动添加灵力字段
4. **禁词列表**: 世界书中提到避免"极其""一丝""倒吸凉气"等AI口癖词，但未实现自动检测
5. **图鉴前端**: WorkshopGroup 改造后，图鉴页也可以展示配方知识卡
6. **陷阱自动判定**: 已有陷阱每日判定逻辑，但 UI 上没有"查看判定结果"的入口

---

## 十六、对话中的关键约定（用户的原话摘录）

- "再怎么说都要有衣服" → 巫女服保底，initvar 中写死
- "硬核模式删了吧，他是空的没实现" → 已删
- "负重是灵力，灵力值也要做出来了" → 灵力作为核心资源+总开关
- "去严格化——AI 写什么存什么" → enum→string
- "让 AI 每轮全量输出整份 stat_data，不是增量" → 7 组 replace
- "配方并入图鉴，纯 AI 驱动" → 删合成引擎，配方改知识卡
- "搜刮应该是到遗迹/物资点时才触发" → AI 驱动弹窗
- "前端只做框架让 AI 返回变量" → 前端不替代 AI 逻辑
- "不碰存档" → 全程 schema 只新增/放宽
- "低开局(艰难起步)" → 灵力 8
