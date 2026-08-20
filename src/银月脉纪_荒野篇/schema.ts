// ═══════════════════════════════════════════════════════════════
// 银月脉纪：荒野篇 — MVU 变量结构
// 所有动态集合使用 z.record(z.string(), ...) — AI 随时 insert 新条目
// $前缀字段为只读计算属性 — AI 不应更新，由 transform 自动生成
// ═══════════════════════════════════════════════════════════════

// ── 位置容量单一数据源（舒适/绝对上限 kg）──
// schema transform 与前端（InventoryGroup / SetupWizard）共用此表，避免三处重复定义漂移。
// 新增位置或调整上限时只改这一处。'营地存储'/'地面'不计随身负重，故不在容量表里。
export const POS_CAPS: Record<string, { 舒适: number; 绝对: number }> = {
  '手持': { 舒适: 1, 绝对: 3 },
  '背包': { 舒适: 6, 绝对: 12 },
  '腰挂': { 舒适: 1.5, 绝对: 3 },
  '尾藏': { 舒适: 0.3, 绝对: 1 },
  '颈间': { 舒适: 0.1, 绝对: 0.3 },
  '穿着': { 舒适: 2, 绝对: 5 },
};

// 位置 → 图标（前端展示用，与 POS_CAPS 同源管理）
export const POS_ICONS: Record<string, string> = {
  '手持': '✋', '背包': '🎒', '腰挂': '🔗', '尾藏': '🦊', '颈间': '💎', '穿着': '👘', '营地存储': '🏕️', '地面': '🌱', '其他': '📦',
};

export const Schema = z
  .object({
    // ═══════════════════════════════════════════════════════
    // 晓光 — 角色核心
    // ═══════════════════════════════════════════════════════
    晓光: z
      .object({
        基础属性: z
          .object({
            体质: z.coerce.number().prefault(2).transform(v => _.clamp(v, 1, 20)),
            敏捷: z.coerce.number().prefault(2).transform(v => _.clamp(v, 1, 20)),
            智力: z.coerce.number().prefault(8).transform(v => _.clamp(v, 1, 20)),
            意志: z.coerce.number().prefault(4).transform(v => _.clamp(v, 1, 20)),
            感知: z.coerce.number().prefault(4).transform(v => _.clamp(v, 1, 20)),
          })
          .prefault({}),

        生存状态: z
          .object({
            饥饿: z.coerce.number().prefault(85).transform(v => _.clamp(v, 0, 100)),
            口渴: z.coerce.number().prefault(55).transform(v => _.clamp(v, 0, 100)),
            体温: z.coerce.number().prefault(36.8).transform(v => _.clamp(Number.isNaN(v)?36.8:v, 30, 43)),
            精力: z.coerce.number().prefault(38).transform(v => _.clamp(v, 0, 100)),
            健康: z.coerce.number().prefault(78).transform(v => _.clamp(v, 0, 100)),
            精神: z.coerce.number().prefault(75).transform(v => _.clamp(v, 0, 100)),
          })
          .prefault({}),

        属性成长: z
          .object({
            体质XP: z.coerce.number().prefault(20).transform(v => _.clamp(v, 0, 99999)),
            敏捷XP: z.coerce.number().prefault(45).transform(v => _.clamp(v, 0, 99999)),
            意志XP: z.coerce.number().prefault(10).transform(v => _.clamp(v, 0, 99999)),
            感知XP: z.coerce.number().prefault(80).transform(v => _.clamp(v, 0, 99999)),
          })
          .prefault({}),

        营养代谢: z
          .object({
            今日摄入: z
              .object({
                卡路里: z.coerce.number().prefault(1000),
                蛋白质克: z.coerce.number().prefault(18),
                脂肪克: z.coerce.number().prefault(22),
                碳水克: z.coerce.number().prefault(180),
              })
              .prefault({}),
            体脂储备: z.coerce.number().prefault(18).transform(v => _.clamp(v, 3, 50)),
            基础代谢率: z.coerce.number().prefault(1450),
            蛋白质平衡: z.coerce.number().prefault(0).transform(v => _.clamp(v, -100, 100)),
          })
          .prefault({}),

        伤口: z
          .record(
            z.string().describe('伤口标识'),
            z.object({
              位置: z.string(),
              类型: z.enum(['割伤', '擦伤', '挫伤', '骨折', '冻伤', '烧伤', '刺伤', '扭伤', '拉伤']),
              严重度: z.enum(['轻微', '中度', '严重', '危急']),
              愈合阶段: z.enum(['出血', '凝血', '结痂', '愈合中', '已愈合', '留疤']),
              感染风险: z.enum(['低', '中', '高', '已感染']),
              对行动影响: z.string(),
              处理方式: z.string(),
              预计愈合天数: z.coerce.number(),
              受伤天数: z.coerce.number().prefault(0),
            }),
          )
          .prefault({}),

        疾病: z
          .record(
            z.string().describe('病名'),
            z.object({
              症状: z.string(),
              严重度: z.enum(['潜伏期', '轻微', '中度', '严重', '危急']),
              阶段: z.string(),
              传染性: z.enum(['无', '低', '中', '高']),
              处理方式: z.string(),
            }),
          )
          .prefault({}),

        疲劳: z
          .object({
            肌肉疲劳: z.coerce.number().prefault(35).transform(v => _.clamp(v, 0, 100)),
            // 睡眠债务的唯一真源已移至 晓光.睡眠.睡眠债务，此字段保留仅供向后兼容，由顶层 transform 同步
            睡眠债务: z.coerce.number().prefault(4).transform(v => _.clamp(v, 0, 48)),
            累积负荷: z.string().prefault('疲惫'),            // 建议：轻松/正常/疲惫/透支/极限
          })
          .prefault({}),

        狐类特性: z
          .object({
            灵力环境: z.enum(["稀薄","正常","充沛"]).prefault("稀薄"),
            // ── 灵力核心：纯数值、无上限、动态满格条 ──
            // 灵力是核心资源+总开关：够高就能弥补/解除负重、伤口恢复、失温、精力等限制。
            // 灵力值不设上限（只防负）；前端以"动态满格"显示，满格参考=历史峰值。
            // 环境衰减/恢复由脚本算（按灵脉强度），主动消耗（施法/疗伤/扛重）由 AI 在叙事里写。
            灵力值: z.coerce.number().prefault(20).transform(v => Math.max(0, v)),
            灵力峰值: z.coerce.number().prefault(20).transform(v => Math.max(0, v)),
        狐尾湿度: z.enum(['干燥', '微湿', '湿透']).prefault('干燥'),
            九尾状态: z.enum(['合并一尾', '部分展开', '完全展开']).prefault('合并一尾'),
          })
          .passthrough()
          // 同步历史峰值：灵力值新高时自动记入灵力峰值（供前端动态满格参考）
          .transform(d => {
            const v = d.灵力值 ?? 0;
            const peak = Math.max(d.灵力峰值 ?? 0, v);
            return { ...d, 灵力值: v, 灵力峰值: peak };
          })
          .prefault({}),

        // 生理状态：发情期由满月触发（世界.天体.月相='满月'）或长期压抑积累。
        // 主人缺席荒野时无法完全解除，只能由隐秘慰藉机制部分缓解（见世界书 条件事件/晓光身体设定）。
        // 隐藏机制，不上前端 UI；供 AI 在身体/亲密叙事时读写。
        生理状态: z
          .object({
            发情期: z.enum(['无', '萌动', '发情中', '部分缓解', '余韵']).prefault('无'),
          })
          .prefault({}),

        执念: z
          .object({
            状态: z.enum(['稳固', '动摇', '崩溃']).prefault('稳固'),
            强度: z.coerce.number().prefault(85).transform(v => _.clamp(v, 0, 100)),
            近期波动: z.string().prefault(''),
            核心锚点: z.string().prefault(''),
          })
          .prefault({}),

        睡眠: z
          .object({
            上次睡眠时长: z.coerce.number().prefault(0),
            睡眠债务: z.coerce.number().prefault(4).transform(v => _.clamp(v, 0, 48)),
            睡眠质量: z.enum(['未睡', '浅眠断续', '浅眠', '正常', '深睡']).prefault('未睡'),
            最近中断: z.string().prefault('尚未入睡'),
            床铺类型: z.string().prefault('无'),  // 建议：无/裸地/草垫/保温毯/帐篷/庇护所床铺
          })
          .prefault({}),

        第六感: z
          .object({
            听觉预警: z
              .record(z.string().describe('方位'), z.object({
                声音类型: z.string(),
                距离估计: z.string(),
                威胁评估: z.string(),                       // 建议：无害/注意/警惕/危险
              }))
              .prefault({}),
            嗅觉探测: z
              .record(z.string().describe('气味源'), z.object({
                气味类型: z.string(),
                强度: z.string(),                          // 建议：微弱/明显/浓烈
                方向: z.string(),
                关联信息: z.string(),
              }))
              .prefault({}),
            灵力感知: z.string().prefault(''),
            时间感知偏差: z.string().prefault('正常'),
          })
          .prefault({}),

        // ── 心理状态：精神系统的层次化扩展（v4 新增）──
        // 供状态页精神事件时间线、首页精神环深度展示。AI 在叙事中根据事件写入。
        心理状态: z
          .object({
            心情: z.string().prefault('平静'),              // 建议：平静/紧张/恐惧/焦虑/安心/兴奋/绝望/思念
            情绪强度: z.coerce.number().prefault(50).transform(v => _.clamp(v, 0, 100)),
            社交需求: z.coerce.number().prefault(30).transform(v => _.clamp(v, 0, 100)),
            压力源: z.array(z.string()).prefault([]),       // 当前压力来源列表
            精神事件: z
              .record(
                z.string().describe('事件标识 D天 时段'),
                z.object({
                  内容: z.string(),
                  类型: z.enum(['积极', '消极', '中性']).prefault('中性'),
                  影响: z.string().prefault(''),            // 对精神的影响描述
                  时间: z.string().prefault(''),            // D3 黄昏 等
                }),
              )
              .prefault({}),
          })
          .prefault({}),

        // ── 技能熟练度：与基础属性平行，反映实际操作经验（v4 新增）──
        // 多次制作/狩猎/采集可提升熟练度，影响成功率。AI 在玩家重复操作时小幅增加。
        技能熟练度: z
          .object({
            制作: z.coerce.number().prefault(1).transform(v => _.clamp(v, 1, 20)),
            狩猎: z.coerce.number().prefault(1).transform(v => _.clamp(v, 1, 20)),
            采集: z.coerce.number().prefault(1).transform(v => _.clamp(v, 1, 20)),
            医疗: z.coerce.number().prefault(1).transform(v => _.clamp(v, 1, 20)),
            生存: z.coerce.number().prefault(1).transform(v => _.clamp(v, 1, 20)),
          })
          .prefault({}),

        // ── 任务/目标系统：AI 可给玩家短期目标（v4 新增）──
        // 供首页推荐路线、任务追踪。AI 在剧情推进时写入/更新/完成。
        任务: z
          .record(
            z.string().describe('任务标识'),
            z.object({
              描述: z.string(),
              类型: z.enum(['探索', '采集', '狩猎', '制作', '生存', '主线', '支线']).prefault('生存'),
              状态: z.enum(['进行中', '已完成', '失败', '已放弃']).prefault('进行中'),
              进度: z.string().prefault(''),               // 自由描述进度
              奖励: z.string().prefault(''),               // 完成后的收益描述
            }),
          )
          .prefault({}),

        // ── 关系/社交：遇到 NPC 或驯化动物时用（v4 新增）──
        // 供图鉴页 NPC 标注、关系追踪。荒野篇主要是动物，但也可能遇到其他幸存者。
        关系: z
          .record(
            z.string().describe('关系对象名'),
            z.object({
              类型: z.enum(['动物', 'NPC', '妖兽', '其他']).prefault('动物'),
              好感度: z.coerce.number().prefault(0).transform(v => _.clamp(v, -100, 100)),
              信任度: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 100)),
              备注: z.string().prefault(''),
              首次遭遇: z.string().prefault(''),
            }),
          )
          .prefault({}),
      })
      .passthrough()
      .transform(data => {
        const 精神 = data.生存状态?.精神 ?? 75;
        return {
          ...data,
          $精神区间:
            精神 >= 80 ? '稳定' :
            精神 >= 50 ? '压抑' :
            精神 >= 25 ? '临界' : '崩溃',
          $思维加速可用: (data.基础属性?.智力 ?? 8) >= 8,
        };
      })
      .prefault({}),

    // ═══════════════════════════════════════════════════════
    // 世界 — 环境/时间/地形/天气/水文/天体
    // ═══════════════════════════════════════════════════════
    世界: z
      .object({
        时间: z
          .object({
            天数: z.coerce.number().prefault(0),
            时段: z.enum(['黎明', '清晨', '正午', '午后', '黄昏', '夜晚', '深夜']).prefault('清晨'),
            天气: z.enum(['晴', '多云', '阴', '微雨', '大雨', '暴风雨', '雾', '雪', '暴风雪']).prefault('阴'),
            季节: z.enum(['深秋', '初冬', '严冬', '早春']).prefault('深秋'),
            // 月相真源统一在 世界.天体.月相；此字段保留为冗余显示，由顶层 transform 同步（防止漂移）
            月相: z.enum(['新月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月']).prefault('残月'),
          })
          .prefault({}),

        地形: z
          .object({
            当前位置: z.string().prefault(''),
            北方: z.string().prefault(''),
            南方: z.string().prefault(''),
            东方: z.string().prefault(''),
            西方: z.string().prefault(''),
            // 灵脉强度：AI 可写自由描述，脚本据此在时间推进里给 灵力值 自然增减。
            // 建议：枯竭/稀薄/正常/丰沛/灵脉交汇。丰沛区回灵、稀薄/枯竭区掉灵。
            灵脉强度: z.string().prefault('正常'),
          })
          .prefault({}),

        地势: z
          .object({
            // 去严格化：描述性字段改 string，AI 可写自由描述（推荐值见注释），不再被枚举拒绝
            坡度: z.string().prefault('缓坡'),               // 建议：平坦/缓坡/中坡/陡坡/悬崖
            地表类型: z.string().prefault('针叶铺地'),        // 建议：碎石/泥地/草地/针叶铺地/雪地/岩石/沙地
            路径质量: z.string().prefault('开阔'),           // 建议：无路/兽径/小路/清晰路径/开阔
            迷路风险: z.enum(['低', '中', '高', '极高']).prefault('低'),
          })
          .prefault({}),

        地标: z
          .record(z.string().describe('地标名'), z.object({
            名称: z.string(),
            方位: z.enum(['北', '南', '东', '西', '东北', '西北', '东南', '西南']),
            距离: z.string(),
            类型: z.enum(['水源', '庇护所', '资源点', '遗迹', '危险区', '制高点', '路径', '采集点', '狩猎点']),
            描述: z.string(),
            已探索: z.boolean().prefault(false),
          }))
          .prefault({}),

        天气详情: z
          .object({
            温度: z.coerce.number().prefault(7),
            体感温度: z.coerce.number().prefault(5),
            湿度: z.coerce.number().prefault(68).transform(v => _.clamp(v, 5, 100)),
            风速: z.coerce.number().prefault(2).transform(v => _.clamp(v, 0, 40)),
            风向: z.enum(['北', '南', '东', '西', '东北', '西北', '东南', '西南', '无风']).prefault('西北'),
            地表状况: z.string().prefault('微湿'),            // 建议：干燥/微湿/泥泞/冻结/积雪/冰面
            树冠覆盖率: z.coerce.number().prefault(65).transform(v => _.clamp(v, 0, 100)),
            气压趋势: z.string().prefault('稳定'),            // 建议：上升/稳定/下降
            光照明度: z.string().prefault('阴翳'),            // 建议：全暗/微光/阴翳/明亮/直射
            // ── v4 新增：天气详情扩展 ──
            风速等级: z.enum(['无风', '微风', '中风', '大风', '狂风', '暴风']).prefault('微风'),
            降水概率: z.coerce.number().prefault(20).transform(v => _.clamp(v, 0, 100)),
            日照强度: z.coerce.number().prefault(30).transform(v => _.clamp(v, 0, 100)),
          })
          .prefault({}),

        水文: z
          .object({
            溪流水位: z.string().prefault('低位'),            // 建议：干涸/枯水/低位/正常/高位/泛滥
            流速: z.string().prefault('缓慢'),                // 建议：静止/缓慢/中等/湍急
            浑浊度: z.string().prefault('微浊'),              // 建议：清澈/微浊/浑浊/泥浆
            水生生物: z.string().prefault(''),
            地下水可获取性: z.string().prefault('需深挖'),      // 建议：不可及/需深挖/浅挖可得/地表渗出
            雨水收集效率: z.coerce.number().prefault(0),
          })
          .prefault({}),

        天体: z
          .object({
            日出时分: z.string().prefault('06:47'),
            日落时分: z.string().prefault('17:02'),
            月相: z.enum(['新月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月']).prefault('残月'),
            可见星座: z.string().prefault(''),
            夜间能见度: z.enum(['漆黑', '微光', '月光可辨', '明亮']).prefault('月光可辨'),
          })
          .prefault({}),

        // ── 环境感知：第六感的显式数据化（v4 新增）──
        // 供世界页环境感知展示、首页环境威胁评级。AI 在探索/观察时写入。
        环境感知: z
          .object({
            环境舒适度: z.coerce.number().prefault(50).transform(v => _.clamp(v, 0, 100)),
            噪声等级: z.coerce.number().prefault(10).transform(v => _.clamp(v, 0, 100)),
            气味强度: z.coerce.number().prefault(20).transform(v => _.clamp(v, 0, 100)),
            威胁感: z.coerce.number().prefault(10).transform(v => _.clamp(v, 0, 100)),
            灵力感知: z.string().prefault(''),              // 灵脉/妖气/异常感知
          })
          .prefault({}),

        // ── 危险区域：已知危险点地图标注（v4 新增）──
        // 供世界页手绘地图危险标注。AI 在发现危险时 insert。
        危险区域: z
          .record(
            z.string().describe('危险区域名'),
            z.object({
              类型: z.enum(['野兽领地', '悬崖', '沼泽', '急流', '滑坡', '妖气', '其他']).prefault('其他'),
              方位: z.string().prefault(''),               // 自由描述方位
              距离: z.string().prefault(''),
              威胁等级: z.enum(['低', '中', '高', '极高']).prefault('中'),
              描述: z.string().prefault(''),
              已确认: z.boolean().prefault(false),
            }),
          )
          .prefault({}),
      })
      .prefault({}),

    // ═══════════════════════════════════════════════════════
    // 装备 — 物品栏/容器/衣物/负重
    // ═══════════════════════════════════════════════════════
    装备: z
      .object({
        负重: z
          .object({
            // 改为只读派生：当前负重由 transform 从物品栏实时算（排除待打捞货舱）
            // 字段保留以兼容旧存档，但 AI 不应再手动写
            当前: z.coerce.number().prefault(0),
            安全上限: z.coerce.number().prefault(9),
          })
          .prefault({}),

        物品栏: z
          .record(z.string().describe('物品唯一标识名'), z.object({
            名称: z.string(),
            分类: z.enum([
              '工具', '容器', '食物', '庇护', '武器', '医疗',
              '电子', '特殊', '材料', '自制', '弹药', '烹饪',
            ]),
            重量: z.coerce.number(),
            位置: z.enum(['手持', '背包', '腰挂', '尾藏', '颈间', '穿着', '营地存储', '地面']),
            描述: z.string(),
            耐久度: z.coerce.number().optional(),
            数量: z.coerce.number().optional(),
            容量: z.coerce.number().optional(),
            当前容量: z.coerce.number().optional(),
            保质期天: z.coerce.number().optional(),
            锋利度: z.coerce.number().optional(),
            电量: z.coerce.number().optional(),
            使用次数剩余: z.coerce.number().optional(),
            保暖值: z.coerce.number().optional(),
            防风值: z.coerce.number().optional(),
            防水性: z.enum(['不防水', '防泼水', '防水', '完全防水']).optional(),
            湿度: z.coerce.number().optional(),
            破损度: z.coerce.number().optional(),
            燃烧时长分钟: z.coerce.number().optional(),
            结构强度: z.coerce.number().optional(),
            材料类型: z.enum(['硬木', '软木', '燧石', '花岗岩', '石灰岩', '砂岩', '黏土', '骨', '筋', '皮', '纤维', '金属', '布料', '塑料']).optional(),
            // 物品状态（前端拾取弹窗 ChoiceModal 透传字段，正式纳入校验避免被 strip）
            易损度: z.coerce.number().optional(),
            损坏标签: z.enum(['完好', '少耐久', '部分损坏', '损坏']).optional(),
            可修理: z.boolean().optional(),
            可拆解: z.boolean().optional(),
          }))
          .prefault({}),

        容器: z
          .record(z.string().describe('容器名'), z.object({
            类型: z.enum(['金属壶', '折叠水袋', '皮水囊', '陶罐', '竹筒', '塑料瓶', '临时容器']),
            容量: z.coerce.number(),
            当前装载: z.coerce.number(),
            可加热: z.boolean(),
            密封性: z.enum(['无盖', '简易覆盖', '密封', '完全密封']),
            装载内容: z.string(),
          }))
          .prefault({}),

        衣物: z
          .record(z.string().describe('衣物名'), z.object({
            部位: z.enum(['头部', '上身', '下身', '脚部', '手部', '颈部', '全身']),
            保暖值: z.coerce.number(),
            防风值: z.coerce.number(),
            防水性: z.enum(['不防水', '防泼水', '防水', '完全防水']),
            湿度: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 100)),
            破损度: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 100)),
            当前层次: z.enum(['贴身', '中间层', '外层']),
          }))
          .prefault({}),

        // 默认空：玩家未在向导中分配任何物品到「手持/穿着」时，前端显示"无"。
        // 不再硬编码 '金属杆' / '破损的巫女服'，避免初始化前界面误显已存在的装备。
        手持: z.string().prefault(''),
        穿着: z.string().prefault(''),
      })
      .prefault({}),

    // ── 待搜刮货舱：SetupWizard 初始化时写入的持久参考数据（玩家选入行李舱、暂不计随身负重的物品）。
    //    $ 前缀但非派生：纳入 schema 契约以防 passthrough 被移除或重新 parse 时静默丢失。
    $待搜刮货舱: z
      .array(z.object({
        id: z.string(),
        名称: z.string(),
        重量: z.coerce.number(),
      }))
      .prefault([]),

    // ═══════════════════════════════════════════════════════
    // 工坊 — 配方 + 陷阱
    // ═══════════════════════════════════════════════════════
    工坊: z
      .object({
        配方: z
          .record(z.string().describe('配方名'), z.object({
            已解锁: z.boolean(),
            所需材料: z.record(z.string(), z.coerce.number()),
            所需工具: z.string(),
            效果描述: z.string(),
            制作耗时分钟: z.coerce.number(),
            所需智力: z.coerce.number().prefault(0),
            // 合成产出（引擎校验扣减材料后据此产出新物品到物品栏）
            产出物: z.string().prefault(''),
            产出数量: z.coerce.number().prefault(1),
            产出分类: z.enum(['工具','容器','食物','庇护','武器','医疗','电子','特殊','材料','自制','弹药','烹饪']).optional(),
            产出重量: z.coerce.number().optional(),
          }))
          .prefault({}),

        陷阱: z
          .record(z.string().describe('陷阱标识'), z.object({
            位置: z.string(),
            类型: z.enum(['绳索陷阱', '钢丝锯陷阱', '弹性拉索陷阱', '落穴陷阱', '网陷阱', '简易钓钩', '藤蔓陷阱']),
            状态: z.enum(['布置中', '待机', '已触发', '捕获成功', '捕获逃脱', '已损坏', '已回收']),
            捕获物: z.string().prefault(''),
            布置天数: z.coerce.number().prefault(0),
            重置需求: z.string().prefault(''),
            // ── v4 新增：捕获历史 ──
            捕获历史: z.array(z.object({
              时间: z.string().prefault(''),
              捕获物: z.string().prefault(''),
              结果: z.enum(['成功', '逃脱', '空']).prefault('空'),
            })).prefault([]),
          }))
          .prefault({}),
      })
      .prefault({}),

    // ═══════════════════════════════════════════════════════
    // 图鉴 — 野兽/草药/足迹/日志
    // ═══════════════════════════════════════════════════════
    图鉴: z
      .object({
        野兽: z
          .record(z.string().describe('生物名'), z.object({
            名称: z.string(),
            分类: z.enum(['哺乳类', '鸟类', '爬行类', '鱼类', '节肢类', '妖兽', '不明']),
            危险等级: z.enum(['无害', '警惕', '危险', '致命']),
            体型: z.enum(['微型', '小型', '中型', '大型', '巨型']),
            活动时段: z.string(),
            习性: z.string(),
            足迹描述: z.string(),
            叫声描述: z.string(),
            遭遇记录: z.string(),
            首次发现地点: z.string(),
            首次发现时间: z.string(),
            是否可食用: z.string().prefault('未知'),
            掉落物: z.string().prefault('未知'),
          }))
          .prefault({}),

        草药: z
          .record(z.string().describe('植物名'), z.object({
            名称: z.string(),
            识别特征: z.string(),
            药用功效: z.string(),
            采集部位: z.string(),
            处理方式: z.string(),
            禁忌: z.string().prefault('未知'),
            发现地点: z.string(),
            季节: z.string(),
            采集数量: z.coerce.number().prefault(0),
            // ── v4 新增：毒性标识 ──
            毒性: z.enum(['安全', '微毒', '剧毒']).prefault('安全'),
            中毒症状: z.string().prefault(''),
          }))
          .prefault({}),

        足迹: z
          .record(z.string().describe('发现标识'), z.object({
            发现地点: z.string(),
            推测生物: z.string(),
            新鲜度: z.enum(['极新', '新', '较新', '旧', '极旧']),
            方向: z.string(),
            备注: z.string(),
          }))
          .prefault({}),

        日志: z
          .record(
            z.string().describe('日期 第X天 HH:MM'),
            z.union([
              // 旧格式：纯字符串（向后兼容）
              z.string().transform(s => ({ 内容: s, 类型: '其他' as const })),
              // 新格式：带类型标签（v4 新增）
              z.object({
                内容: z.string(),
                类型: z.enum(['探索', '采集', '狩猎', '制作', '战斗', '休息', '危机', '其他']).prefault('其他'),
              }),
            ]),
          )
          .prefault({}),
      })
      .prefault({}),

    // ═══════════════════════════════════════════════════════
    // 营地 — 庇护所/篝火/储水/食物库存
    // ═══════════════════════════════════════════════════════
    营地: z
      .object({
        庇护所: z
          .object({
            // 类型非严格——AI 可写"天然岩壁凹陷"等自由描述；'无' 或空串视为未建
            类型: z.string().prefault('无'),  // 建议：无/临时草铺/狐尾裹身/保温毯帐篷/天然岩洞/木架帐篷/加固庇护所
            完整度: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 100)),
            舒适度: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 10)),
            防水性: z.string().prefault('无'),  // 建议：无/差/一般/好/极好
            防风性: z.string().prefault('无'),  // 建议：无/差/一般/好/极好
            内部温差: z.coerce.number().prefault(0),
          })
          .prefault({}),

        篝火: z
          .object({
            状态: z.enum(['未点燃', '引火中', '点燃', '旺盛', '衰减', '余烬', '熄灭']).prefault('未点燃'),
            中心温度: z.coerce.number().prefault(0),
            热辐射半径: z.coerce.number().prefault(0),
            燃料类型: z.string().prefault('无'),
            燃料余量: z.coerce.number().prefault(0),
            消耗率: z.coerce.number().prefault(0),
          })
          .prefault({}),

        储水: z
          .record(z.string().describe('容器名'), z.object({
            容器: z.string(),
            容量: z.coerce.number(),
            水质: z.enum(['生水', '沉淀中', '煮沸中', '可饮用', '已污染']),
            收集日期: z.string(),
            来源: z.string(),
          }))
          .prefault({}),

        食物库存: z
          .record(z.string().describe('食物名'), z.object({
            物品引用: z.string(),
            数量: z.coerce.number(),
            单位: z.enum(['个', '块', '份', '条', '把', '片', '块菌']),
            收集日期: z.string(),
            保质期剩余天: z.coerce.number(),
            腐败风险: z.enum(['安全', '需尽快食用', '即将腐败', '已腐败']).prefault('安全'),
          }))
          .prefault({}),

        // ── 营地建设状态：升级树数值反馈（v4 新增）──
        // 供营地页升级树展示。AI 在玩家建设营地时更新。
        建设状态: z
          .object({
            建设进度: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 100)),
            防御度: z.enum(['无', '差', '一般', '好', '极好']).prefault('无'),
            隐蔽度: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 100)),
            当前等级: z.string().prefault('无'),            // 无/临时/简易/加固/永久
            下一级需求: z.string().prefault(''),            // 如"需木板×3"
          })
          .prefault({}),
      })
      .prefault({}),

    // ═══════════════════════════════════════════════════════
    // 环境感知 — 声学/气味
    // ═══════════════════════════════════════════════════════
    环境感知: z
      .object({
        声学: z
          .object({
            环境噪声音量: z.string().prefault('安静'),        // 建议：死寂/安静/轻微/正常/嘈杂
            晓光自身噪音: z.string().prefault('轻微'),         // 建议：无声/极低/轻微/明显/嘈杂
            可闻距离: z.coerce.number().prefault(150),
          })
          .prefault({}),

        气味: z
          .object({
            主导气味: z.string().prefault(''),
            晓光自身气味强度: z.string().prefault('轻微'),     // 建议：无/微弱/轻微/明显/浓烈
            嗅觉可追踪距离: z.coerce.number().prefault(80),
            风对气味的携带: z.string().prefault(''),
          })
          .prefault({}),
      })
      .prefault({}),
  })
  .passthrough()
  .transform(data => {
    // ═══════════════════════════════════════════════════════
    // 顶层衍生计算 — 所有跨域 $只读字段
    // AI 不应更新这些字段，每次解析时自动重新计算
    // ═══════════════════════════════════════════════════════
    const 物品栏 = data.装备.物品栏 || {};
    // 物品栏总重（包括存放在营地等位置的物品）
    const $装备总重 = _(物品栏)
      .values()
      .sumBy((item: any) => (item.重量 || 0) * (item.数量 || 1));
    // ── 当前随身负重：所有物品一律按位置过滤（营地存储/地面不计入随身）
    const $当前负重 = _(物品栏)
      .entries()
      .filter(([, item]: [string, any]) => {
        return item.位置 !== '营地存储' && item.位置 !== '地面';
      })
      .sumBy(([, item]: [string, any]) => (item.重量 || 0) * (item.数量 || 1));
    // 同步把 装备.负重.当前 写为派生值（不破坏旧消费者）
    if (data.装备 && data.装备.负重) {
      data.装备.负重.当前 = Math.round($当前负重 * 10) / 10;
    }
    const 安全上限 = data.装备.负重.安全上限 || 9;
    const 负重比 = $当前负重 / 安全上限;

    // ── 灵力总开关：灵力缓冲系数 ──
    // 灵力高时可"扛重"——负重惩罚按系数衰减。灵力 200+ 时负重惩罚归零，低灵力时全额回来。
    // 灵力缓冲系数 = clamp(1 − 灵力值/200, 0, 1)：灵力 0→系数1(全额惩罚), 灵力 100→0.5(半减), 灵力 200+→0(无惩罚)
    const 灵力值_负重 = data.晓光?.狐类特性?.灵力值 ?? 20;
    const $灵力缓冲系数 = Math.max(0, Math.min(1, 1 - 灵力值_负重 / 200));
    // ── 细档负重速度修正（接近安全上限即有惩罚）──
    const $负重速度修正_raw =
      负重比 < 0.8 ? 0 :
      负重比 < 1.0 ? -3 :
      负重比 < 1.2 ? -10 :
      负重比 < 1.5 ? -22 : -40;
    // 灵力扛重：负重惩罚乘以缓冲系数（只减惩罚，不加奖励）
    const $负重速度修正 = Math.round($负重速度修正_raw * $灵力缓冲系数);

    // ── 负载分布：按位置分组求和，对照舒适/绝对上限 ──
    // POS_CAPS 已提到顶层导出，前端共用；此处直接引用。
    const 位置重: Record<string, number> = {};
    let 单点超载 = false;
    let 单点超舒适 = false;
    for (const item of Object.values(物品栏) as any[]) {
      const pos = item.位置;
      if (!POS_CAPS[pos]) continue;
      位置重[pos] = (位置重[pos] || 0) + (item.重量 || 0) * (item.数量 || 1);
    }
    for (const [pos, w] of Object.entries(位置重)) {
      const cap = POS_CAPS[pos];
      if (!cap) continue;
      if (w > cap.绝对) 单点超载 = true;
      else if (w > cap.舒适) 单点超舒适 = true;
    }
    // 分布不均：某位置 > 总重60%
    const 主重 = Math.max(0, ...Object.values(位置重));
    const 分布不均 = $当前负重 > 0 && (主重 / $当前负重) > 0.6;
    const $分布惩罚 = 单点超载 ? -10 : (分布不均 || 单点超舒适) ? -5 : 0;

    const 狐尾湿度 = data.晓光.狐类特性.狐尾湿度;
    const 狐尾湿透 = 狐尾湿度 === '湿透';
    const 狐尾微湿 = 狐尾湿度 === '微湿';
    const $狐尾裹身速度修正 = 狐尾湿透 ? 0 : -5;
    const $湿尾速度修正 = 狐尾湿透 ? -20 : 狐尾微湿 ? -8 : 0;
    const $移动速度总修正 = $负重速度修正 + $狐尾裹身速度修正 + $湿尾速度修正 + $分布惩罚;

    // ── 衣物分层加权保暖 ──
    // 总保暖 = Σ 保暖值 × 层次权重(贴身1.0/中间0.8/外层0.6) × (1 − 湿度/100×0.5) × (1 − 破损度/100)
    // 总防风 = Σ 防风值 × (1 − 破损度/100)（外层为主，由层次自然加权）
    const LAYER_W: Record<string, number> = { '贴身': 1.0, '中间层': 0.8, '外层': 0.6 };
    const $总保暖值 = _(data.装备.衣物 || {}).values().sumBy((c: any) => {
      const lw = LAYER_W[c.当前层次] ?? 0.7;
      const moist = 1 - ((c.湿度 || 0) / 100) * 0.5;
      const intact = 1 - ((c.破损度 || 0) / 100);
      return (c.保暖值 || 0) * lw * moist * intact;
    });
    const $总防风值 = _(data.装备.衣物 || {}).values().sumBy((c: any) => {
      const intact = 1 - ((c.破损度 || 0) / 100);
      return (c.防风值 || 0) * intact;
    });

    // ── 失温公式重写 ──
    const 体温 = data.晓光.生存状态.体温;
    const 气温 = data.世界?.天气详情?.温度 ?? 7;
    const 风速 = data.世界?.天气详情?.风速 ?? 0;
    // 风寒：风速每增加 1 m/s 体感降约 0.8°C（湿尾/湿衣加倍）
    const 衣物均湿 = (() => {
      const 衣 = Object.values(data.装备.衣物 || {}) as any[];
      if (!衣.length) return 0;
      return _.meanBy(衣, (c: any) => c.湿度 || 0);
    })();
    const 湿衣加倍 = (狐尾湿透 || 衣物均湿 > 50) ? 1.7 : 1;
    const 风寒拉低 = 风速 * 0.8 * 湿衣加倍;
    // 衣物保暖补偿（每点保暖 ≈ 0.6°C 体感提升）
    const 衣物补偿 = $总保暖值 * 0.6;
    // 庇护所内部温差（直接抵在体感上）
    const 庇护补偿 = data.营地?.庇护所?.内部温差 ?? 0;
    // 篝火辐射（旺盛 +6°C, 点燃 +3°C, 衰减/余烬 +1°C）
    const 火状态 = data.营地?.篝火?.状态 ?? '未点燃';
    const 火补偿 = 火状态 === '旺盛' ? 6 : 火状态 === '点燃' ? 3 : (火状态 === '衰减' || 火状态 === '余烬') ? 1 : 0;
    const $体感温度 = Math.round((气温 - 风寒拉低 + 衣物补偿 + 庇护补偿 + 火补偿) * 10) / 10;
    // 失温分级：核心体温优先；其次以体感温度推断散热压力
    const $失温风险等级 =
      体温 < 34 ? '极高' :
      体温 < 35 ? '高' :
      体温 < 35.5 ? '偏高' :
      $体感温度 < -5 ? '极高' :
      $体感温度 < 0 ? '高' :
      $体感温度 < 5 ? '偏高' :
      $体感温度 < 10 ? '正常' : '舒适';
    // ── 灵力影响恢复（连续公式，替代旧的灵力环境三档）──
    // 恢复倍率 = 0.5 + 灵力值/100：灵力 0→0.5(枯竭), 25→0.75, 50→1.0(正常), 100→1.5(旺盛), 全盛时伤口/精力恢复大幅加速
    // 保留对 灵力环境 枚举的向后兼容读取：旧存档若只有灵力环境、无灵力值，则按灵力环境回退。
    const 灵力环境 = data.晓光?.狐类特性?.灵力环境 ?? '稀薄';
    const 灵力值_恢复 = data.晓光?.狐类特性?.灵力值;
    const $恢复倍率 = (typeof 灵力值_恢复 === 'number')
      ? Math.round((0.5 + 灵力值_恢复 / 100) * 100) / 100
      : (灵力环境 === '充沛' ? 1.4 : 灵力环境 === '正常' ? 1.0 : 0.7);

    // ── 灵力等级（供前端显示 + AI 参考）──
    const $灵力等级 =
      灵力值_恢复 == null ? '未知' :
      灵力值_恢复 < 10 ? '枯竭' :
      灵力值_恢复 < 30 ? '稀薄' :
      灵力值_恢复 < 60 ? '充盈' :
      灵力值_恢复 < 100 ? '旺盛' : '全盛';
    // ── 灵力满格参考（前端灵力条的分母，动态涨）──
    const 灵力峰值 = data.晓光?.狐类特性?.灵力峰值 ?? 灵力值_恢复 ?? 20;
    const $灵力满格参考 = Math.max(灵力峰值, 灵力值_恢复 ?? 0, 50);
    // ── 灵力对失温/精力的环境缓冲（灵力高时减轻环境扣减）──
    // 失温缓冲：灵力高时散热速率折扣。系数同 $灵力缓冲系数（复用），高灵力时散热降低。
    // 注意：这是"灵力护体"叙事的数值化——灵力旺盛时对寒冷更有耐受力。

    // ── 单源同步：睡眠债务 / 月相（消除双源漂移）──
    const 睡眠债务真值 = data.晓光?.睡眠?.睡眠债务 ?? data.晓光?.疲劳?.睡眠债务 ?? 4;
    if (data.晓光?.疲劳) data.晓光.疲劳.睡眠债务 = 睡眠债务真值;
    const 月相真值 = data.世界?.天体?.月相 ?? data.世界?.时间?.月相 ?? '残月';
    if (data.世界?.时间) data.世界.时间.月相 = 月相真值 as any;
    if (data.世界?.天体) data.世界.天体.月相 = 月相真值 as any;

    // ── 距失温阈值 / 预计时间（散热速率 > 0 时）──
    // 散热速率(W) 纳入风速/保暖/篝火/庇护，与体感温度同向：冷环境散热高、暖环境散热低
    // 灵力护体：高灵力时散热速率按缓冲系数折扣（灵力旺盛→对寒冷耐受力强，散热降低）
    const 环境冷度 = Math.max(0, 10 - $体感温度); // 体感越低散热越快
    const 散热基数 = Math.max(15, (40 + 环境冷度 * 4) * 湿衣加倍 + (狐尾湿透 ? 18 : 0));
    const $散热速率 = Math.round(散热基数 * (0.6 + 0.4 * $灵力缓冲系数) * 10) / 10;
    const $距失温阈值 = Math.max(0, Math.round((体温 - 35) * 10) / 10);
    // 物理一致：时间 = 热容(J) × ΔT / 功率(W) / 60。人体热容 ≈ 体重50kg × 3500 J/kg·°C
    const 热容J_per_C = 50 * 3500;
    const $预计失温分钟 = $散热速率 > 0 ? Math.round(($距失温阈值 * 热容J_per_C) / $散热速率 / 60) : Infinity;

    // ── 营养需求派生（随体质/气温/活动动态变化，消除前端硬编码常量）──
    // 蛋白需求：随体质成长增加（0.9 × 体质 × 5），体质越高肌肉维持成本越高
    const 体质_营养 = data.晓光?.基础属性?.体质 ?? 2;
    const $蛋白质需求 = Math.round(0.9 * 体质_营养 * 5);
    // 水分流失：基础 + 活动量（肌肉疲劳越高代表劳作越多）+ 高温额外排汗
    const 肌肉疲劳_水 = data.晓光?.疲劳?.肌肉疲劳 ?? 0;
    const 活动加成 = 肌肉疲劳_水 > 50 ? 600 : 肌肉疲劳_水 > 25 ? 300 : 0;
    const 高温加成 = 气温 > 20 ? (气温 - 20) * 40 : 0;
    const $水分流失 = Math.round(1300 + 活动加成 + 高温加成);

    return {
      ...data,
      $装备总重,
      $当前负重,
      $负重比: Math.round(负重比 * 100),
      $负重速度修正,
      $移动速度总修正,
      $狐尾裹身速度修正,
      $湿尾速度修正,
      $分布惩罚,
      $失温风险等级,
      $总保暖值,
      $总防风值,
      $九尾裹身有效: !狐尾湿透,
      $体感温度,
      $风寒拉低: Math.round(风寒拉低 * 10) / 10,
      $衣物补偿: Math.round(衣物补偿 * 10) / 10,
      $庇护补偿: 庇护补偿,
      $火补偿: 火补偿,
      $散热速率,
      $恢复倍率,
      $距失温阈值,
      $预计失温分钟,
      $蛋白质需求,
      $水分流失,
      $灵力缓冲系数: Math.round($灵力缓冲系数 * 100) / 100,
      $灵力等级,
      $灵力满格参考,

      // ═══ v4 新增隐变量 — 先计算再 return（避免作用域问题）═══
      ...(() => {
        const 健康值 = data.晓光?.生存状态?.健康 ?? 75;
        const 精力值 = data.晓光?.生存状态?.精力 ?? 50;
        const 精神值 = data.晓光?.生存状态?.精神 ?? 75;
        const 肌肉疲劳 = data.晓光?.疲劳?.肌肉疲劳 ?? 0;
        const 伤口数 = Object.keys(data.晓光?.伤口 || {}).length;
        const 严重伤口 = _(data.晓光?.伤口 || {}).values().filter((w: any) => w.严重度 === '严重' || w.严重度 === '危急').size();
        const 疾病数 = Object.keys(data.晓光?.疾病 || {}).length;
        const $总体健康评分 = _.clamp(Math.round(健康值 * 0.3 + 精力值 * 0.2 + 精神值 * 0.2 + (100 - 肌肉疲劳) * 0.1 - 伤口数 * 3 - 严重伤口 * 8 - 疾病数 * 5), 0, 100);

        const 饥饿压力 = 100 - (data.晓光?.生存状态?.饥饿 ?? 85);
        const 口渴压力 = 100 - (data.晓光?.生存状态?.口渴 ?? 55);
        const 失温压力 = ($失温风险等级 === '极高' ? 25 : $失温风险等级 === '高' ? 18 : $失温风险等级 === '偏高' ? 10 : 0);
        const 精神压力 = 精神值 < 25 ? 20 : 精神值 < 50 ? 10 : 0;
        const $生存压力指数 = _.clamp(Math.round(饥饿压力 * 0.2 + 口渴压力 * 0.2 + (肌肉疲劳) * 0.15 + 伤口数 * 10 + 疾病数 * 8 + 失温压力 + 精神压力), 0, 100);

        let 威胁分 = 0;
        const 天气 = data.世界?.时间?.天气 ?? '阴';
        if (['大雨', '暴风雨', '暴风雪'].includes(天气)) 威胁分 += 3; else if (['雪', '雾'].includes(天气)) 威胁分 += 2;
        const 迷路 = data.世界?.地势?.迷路风险 ?? '低';
        威胁分 += ({ '低': 0, '中': 1, '高': 2, '极高': 3 } as any)[迷路] ?? 0;
        威胁分 += Object.keys(data.世界?.危险区域 || {}).length * 2;
        威胁分 += Math.floor((data.世界?.环境感知?.威胁感 ?? 0) / 25);
        const 时段 = data.世界?.时间?.时段 ?? '清晨';
        if (时段 === '夜晚' || 时段 === '深夜') 威胁分 += 1;
        const $环境威胁等级 = 威胁分 >= 7 ? '极高' : 威胁分 >= 5 ? '高' : 威胁分 >= 3 ? '中' : 威胁分 >= 1 ? '低' : '无';

        const 庇护完整 = data.营地?.庇护所?.完整度 ?? 0;
        const 庇护舒适 = data.营地?.庇护所?.舒适度 ?? 0;
        const 火状态 = data.营地?.篝火?.状态 ?? '未点燃';
        const 火加分 = ['旺盛', '点燃'].includes(火状态) ? 20 : ['衰减', '余烬'].includes(火状态) ? 8 : 0;
        const 储水量 = _(data.营地?.储水 || {}).values().sumBy((w: any) => w.容量 || 0);
        const 食物数 = Object.keys(data.营地?.食物库存 || {}).length;
        const 建设进度 = data.营地?.建设状态?.建设进度 ?? 0;
        const $营地舒适度 = _.clamp(Math.round(庇护完整 * 0.3 + 庇护舒适 * 3 + 火加分 + Math.min(15, Math.floor(储水量 * 10)) + Math.min(15, 食物数 * 5) + 建设进度 * 0.1), 0, 100);

        const 物品列表 = Object.values(data.装备?.物品栏 || {}) as any[];
        const 有耐久品 = 物品列表.filter((i: any) => i.耐久度 != null || i.破损度 != null);
        const $装备完整度 = !有耐久品.length ? 100 : Math.round(有耐久品.reduce((s: number, i: any) => s + _.clamp(i.耐久度 ?? (100 - (i.破损度 ?? 0)), 0, 100), 0) / 有耐久品.length);

        const 地标列表 = Object.values(data.世界?.地标 || {}) as any[];
        const $探索价值 = 地标列表.filter((l: any) => !l.已探索).length * 2 + 地标列表.filter((l: any) => ['资源点', '采集点', '狩猎点'].includes(l.类型)).length;

        const $今日代谢赤字 = Math.round((data.晓光?.营养代谢?.今日摄入?.卡路里 ?? 0) - (data.晓光?.营养代谢?.基础代谢率 ?? 1450) - 肌肉疲劳 * 5);
        const $预计危机时间 = 健康值 > 30 ? Infinity : Math.round((健康值 / ($生存压力指数 > 70 ? 2 : $生存压力指数 > 50 ? 1 : 0.5)) * 60);

        const 灵脉 = data.世界?.地形?.灵脉强度 ?? '正常';
        const $灵力恢复速率 = Math.max(0, (灵脉 === '丰沛' ? 4 : 灵脉 === '灵脉交汇' ? 6 : 灵脉 === '正常' ? 2 : 灵脉 === '稀薄' ? 1 : 0) + (data.晓光?.狐类特性?.狐尾湿度 === '湿透' ? -1 : 0));
        const $AI叙事压力 = _.clamp(Math.round($生存压力指数 * 0.6 + (精神值 < 25 ? 30 : 精神值 < 50 ? 15 : 0) + ($环境威胁等级 === '极高' ? 15 : $环境威胁等级 === '高' ? 8 : 0)), 0, 100);
        const $热量收入 = 75 + 火补偿 * 10 + Math.round($总保暖值 * 5) + Math.round(庇护补偿 * 3);
        const $热量散失 = $散热速率;

        const issues: string[] = [];
        if ($失温风险等级 === '极高' || $失温风险等级 === '高') issues.push('失温风险');
        if ((data.晓光?.生存状态?.口渴 ?? 55) < 30) issues.push('严重缺水');
        if ((data.晓光?.生存状态?.饥饿 ?? 85) < 25) issues.push('饥饿');
        if (伤口数 > 0) issues.push('受伤');
        if (疾病数 > 0) issues.push('疾病');
        if (精神值 < 25) issues.push('精神崩溃');
        const $状态诊断 = issues.length === 0 ? '状态稳定，注意保持' : issues.join('+') + '，需立即处理';

        const $今日成就 = { 新物种: Object.keys(data.图鉴?.野兽 || {}).length, 新配方: _(data.工坊?.配方 || {}).values().filter((r: any) => r.已解锁).size(), 新地标: Object.keys(data.世界?.地标 || {}).length };

        const 水源地标 = 地标列表.find((l: any) => l.类型 === '水源' && l.已探索);
        const 庇护地标 = 地标列表.find((l: any) => l.类型 === '庇护所' && l.已探索);
        const 未探索地标 = 地标列表.find((l: any) => !l.已探索);
        const parts: string[] = [];
        if (水源地标) parts.push(`前往${水源地标.名称}取水`);
        if (庇护地标 && ($失温风险等级 === '高' || $失温风险等级 === '极高')) parts.push(`回${庇护地标.名称}生火取暖`);
        if (未探索地标) parts.push(`探索${未探索地标.名称}`);
        if (时段 === '黄昏' || 时段 === '夜晚') parts.push('夜间避免外出');
        const $今日推荐路线 = parts.join(' → ') || '保持观察，等待时机';

        return { $总体健康评分, $生存压力指数, $环境威胁等级, $营地舒适度, $装备完整度, $探索价值, $今日代谢赤字, $预计危机时间, $灵力恢复速率, $AI叙事压力, $热量收入, $热量散失, $状态诊断, $今日成就, $今日推荐路线 };
      })(),
    };
  });

export type Schema = z.output<typeof Schema>;
