<template>
  <div class="wizard">
    <div class="wizard-card">
      <h1 class="wizard-title">银月脉纪：荒野篇</h1>
      <p class="wizard-sub">坠机之前，你从残骸中抢救出了什么？<br>你的身体状态如何？</p>
      <div style="text-align:center;margin-bottom:16px;"><button class="hardcore-btn" @click="hardcoreMode">🦴 硬核模式：空手求生</button></div>

      <!-- Step 1: 属性分配 -->
      <section>
        <div class="sec-hdr">📈 分配属性点 <span class="subtle">剩余 {{ remainingPoints }} 点 · 每项至少1点 · 上限20</span></div>
        <div v-for="attr in attributes" :key="attr.key" class="attr-row">
          <span class="attr-icon">{{ attr.icon }}</span>
          <span class="attr-label">{{ attr.label }}</span>
          <span class="attr-desc">{{ attr.desc }}</span>
          <button class="attr-btn" @click="adjust(attr.key, -1)" :disabled="attrs[attr.key] <= 1">−</button>
          <span class="attr-val">{{ attrs[attr.key] }}</span>
          <button class="attr-btn" @click="adjust(attr.key, +1)" :disabled="remainingPoints <= 0 || attrs[attr.key] >= 20">+</button>
        </div>
      </section>

      <!-- Step 2: 物品选择 -->
      <section style="margin-top:20px;">
        <div class="sec-hdr">🎒 选择初始物品 <span class="subtle">已选 {{ selectedCount }} / 20 件</span></div>

        <!-- Weight bar -->
        <div class="weight-bar-card">
          <div class="weight-bar-row">
            <span class="wbr-label">⚖️ 负重</span>
            <span class="wbr-value">{{ carryWeight.toFixed(1) }} / {{ safeLimit.value.toFixed(1) }} kg</span><span v-if="cargoHoldWeight > 0" style="font-size:11px;color:var(--text-secondary);margin-left:4px;"> 📦+{{ cargoHoldWeight.toFixed(1) }}kg待打捞</span>
            <span :class="['wbr-badge', weightRatio > 100 ? 'over' : weightRatio > 80 ? 'warn' : 'safe']">
              {{ weightRatio > 100 ? '⚠️ 超重' : weightRatio > 80 ? '满载' : '安全' }}
            </span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: Math.min(weightRatio, 100) + '%', background: weightGradient }"></div>
          </div>
          <div v-if="weightRatio > 100" class="weight-warning">⚠️ 超过安全负重上限！移动速度大幅下降，体力消耗加速。</div>
        </div>

        <!-- Load Distribution (智力≥6解锁) -->
        <div v-if="attrs['智力'] >= 6 && selectedCount > 0" class="load-card">
          <div class="sec-hdr">🧠 负载均衡分析 <span class="subtle">智力 LV.{{ attrs['智力'] }} 解锁</span></div>
          <div class="load-grid">
            <div v-for="pos in loadPositions" :key="pos.key" class="load-row">
              <span class="load-pos">{{ pos.icon }} {{ pos.label }}</span>
              <span class="load-weight">{{ pos.weight.toFixed(2) }}kg</span>
              <div class="load-bar-track"><div class="load-bar-fill" :style="{ width: pos.pct + '%', background: pos.over ? 'var(--danger)' : 'var(--success)' }"></div></div>
              <span class="load-cap">{{ pos.cap }}kg</span>
            </div>
          </div>
          <div class="load-summary">
            均衡度: <span :class="balanceClass">{{ balanceLabel }}</span> ·
            移速修正: <span :style="{color: speedMod < -15 ? 'var(--danger)' : speedMod < -5 ? 'var(--warning)' : 'var(--success)'}">{{ speedMod }}%</span> ·
            体能效率: <span :style="{color: efficiency > 80 ? 'var(--success)' : efficiency > 60 ? 'var(--warning)' : 'var(--danger)'}">{{ efficiency }}%</span>
          </div>
        </div>

        <!-- Category quick-jump -->
        <div class="cat-bar">
          <button v-for="cat in categories" :key="cat" :class="['cat-chip', { active: activeCategory === cat }]" @click="jumpToCategory(cat)">
            {{ cat }} <span class="cat-count">{{ categoryCount(cat) }}</span>
          </button>
        </div>

        <!-- Items grouped by category -->
        <div v-for="cat in (activeCategory ? [activeCategory] : categories)" :key="cat" :ref="el => catRefs[cat] = el">
          <div class="cat-header">{{ catEmoji(cat) }} {{ cat }} <span class="subtle">{{ categoryCount(cat) }}件 · 已选{{ categorySelected(cat) }}</span></div>
          <div class="item-grid">
            <div v-for="item in itemsByCategory(cat)" :key="item.id" :class="['item-select-card', { selected: selectedIds.has(item.id) }]" @click="toggleItem(item)">
              <div class="is-icon">{{ item.icon }}</div>
              <div class="is-name">{{ item.名称 }}</div>
              <div class="is-weight">{{ item.重量 }}kg</div>
              <div class="is-desc">{{ item.描述 }}</div>
              <div class="is-meta">
                <span v-if="item.耐久度 !== undefined" class="chip">耐久 {{ item.耐久度 }}</span>
                <span v-if="item.使用次数剩余 !== undefined" class="chip">{{ item.使用次数剩余 }}次</span>
                <span v-if="item.数量" class="chip">×{{ item.数量 }}</span>
                <span v-if="item.容量" class="chip">{{ item.容量 }}L</span>
                <span v-if="item.保暖值" class="chip">保暖{{ item.保暖值 }}</span>
              </div>
              <div v-if="selectedIds.has(item.id)" class="is-check">✓</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Step 3: 随身 vs 行李舱 -->
      <section v-if="selectedCount > 0 && !carryAssigned" style="margin-top:20px;">
        <div class="sec-hdr">✈️ 随身携带 vs 放入行李舱</div>
        <div class="risk-warning">
          ⚠️ <strong>行李舱风险</strong>：坠机冲击可能损坏行李舱中的物品。感知越高，物品幸存概率越大。随身携带的物品<strong>100%保留</strong>但计入当前负重。
        </div>
        <div class="weight-split">
          <span>🟢 随身: {{ carryWeight.toFixed(1) }}kg</span>
          <span>📦 行李舱: {{ cargoHoldWeight.toFixed(1) }}kg（暂不计入负重）</span>
        </div>
        <div v-for="id in [...selectedIds]" :key="id" class="carry-row">
          <span class="carry-icon">{{ getItemById(id)?.icon || '📦' }}</span>
          <span class="carry-name">{{ getItemById(id)?.名称 || id }}</span>
          <span class="carry-weight">{{ getItemById(id)?.重量 || 0 }}kg</span>
          <div class="carry-actions">
            <button :class="['carry-btn', 'on-person', { active: carryChoice[id] === 'carry' }]" @click="carryChoice[id]='carry'">✋ 随身</button>
            <button :class="['carry-btn', 'cargo', { active: carryChoice[id] === 'cargo' }]" @click="carryChoice[id]='cargo'">📦 行李舱</button>
          </div>
        </div>
        <button class="confirm-btn" style="margin-top:12px;background:var(--accent);" @click="carryAssigned=true" :disabled="Object.keys(carryChoice).length < selectedCount">确认分配 → 下一步</button>
      </section>

      <!-- Step 4: 物品定位 -->
      <section v-if="selectedCount > 0" style="margin-top:20px;">
        <div class="sec-hdr">📌 物品定位 <span class="subtle">选择每件物品的放置位置——影响负重分布</span></div>
        <div v-for="id in [...selectedIds]" :key="id" class="pos-row">
          <span class="pos-item-icon">{{ getItemById(id)?.icon || "📦" }}</span>
          <span class="pos-item-name">{{ getItemById(id)?.名称 || id }}</span>
          <span class="pos-item-weight">{{ getItemById(id)?.重量 || 0 }}kg</span>
          <select v-model="itemPositions[id]" class="pos-select">
            <option v-for="p in availablePositions" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
      </section>
      <!-- Step 4: 搜刮残骸 -->
      <section v-if="selectedCount > 0" style="margin-top:20px;">
        <div class="sec-hdr">✈️ 搜刮残骸 <span class="subtle">感知影响发现概率</span></div>
        <div v-if="!cargoRolled"><p style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">飞机货舱中的物品——坠机冲击下有些可能还没损坏。</p><button class="roll-btn" @click="rollCargo">🎲 搜索货舱残骸</button></div>
        <div v-else><div v-for="cargo in cargoResults" :key="cargo.id" :class="[`cargo-card`, cargo.survived ? `survived` : `destroyed`]"><span class="cargo-icon">{{ cargo.icon }}</span><div class="cargo-body"><div class="cargo-name">{{ cargo.名称 }} <span class="cargo-weight">{{ cargo.重量 }}kg</span></div><div class="cargo-desc">{{ cargo.描述 }}</div></div><div v-if="cargo.survived"><button v-if="!cargoTaken(cargo)" class="take-btn" @click="takeCargo(cargo)">+ 拾取</button><span v-else class="badge badge-good">已拾取</span></div><span v-else class="badge badge-bad">已损坏</span></div></div>
      </section>
      <!-- 确认按钮 -->
      <button class="confirm-btn" :disabled="selectedCount < 1 || remainingPoints !== 0" @click="confirm">
        {{ remainingPoints !== 0 ? `还需分配 ${remainingPoints} 个属性点` : `🦊 开始求生 (${selectedCount}/20件 · ${totalWeight.toFixed(1)}kg)` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';

const emit = defineEmits<{ done: [attrs: Record<string,number>, items: string[]] }>();

// ─── 属性 ───
const attrs = reactive<Record<string,number>>({ 体质: 2, 敏捷: 2, 智力: 8, 意志: 4, 感知: 4 });
const attributes = [
  { key: '体质', icon: '💪', label: '体质', desc: '负重复原 · 伤病抵抗' },
  { key: '敏捷', icon: '🏃', label: '敏捷', desc: '移动闪避 · 捕猎攀爬' },
  { key: '智力', icon: '🧠', label: '智力', desc: '配方解锁 · 负载均衡' },
  { key: '意志', icon: '🛡️', label: '意志', desc: '精神耐力 · 孤独抗性' },
  { key: '感知', icon: '👁️', label: '感知', desc: '环境察觉 · 追踪预警' },
];
const remainingPoints = computed(() => 20 - Object.values(attrs).reduce((a, b) => a + b, 0));
function adjust(key: string, delta: number) {
  const newVal = attrs[key] + delta;
  if (newVal >= 1 && newVal <= 20 && remainingPoints.value - delta >= 0) attrs[key] = newVal;
}

// ─── 120件物品池 ───
interface ItemOption { id: string; icon: string; 名称: string; 重量: number; 分类: string; 描述: string; 耐久度?: number; 使用次数剩余?: number; 数量?: number; 容量?: number; 保暖值?: number; 锋利度?: number; 电量?: number; 易损度?: number; }
const ITEM_POOL: ItemOption[] = [
  // 工具 (16)
  { id:'打火机',icon:'🔥',名称:'防风打火机',重量:0.05,分类:'工具',描述:'可靠的火源——荒野中最珍贵的物品之一',使用次数剩余:100,易损度:15},
  { id:'手电筒',icon:'🔦',名称:'强光手电筒',重量:0.2,分类:'工具',描述:'LED两档亮度。深秋夜晚漫长，每一分钟电量都要精打细算',耐久度:100,易损度:15},
  { id:'绳索10m',icon:'🎗️',名称:'尼龙绳索10m',重量:0.5,分类:'工具',描述:'干燥完好，承重约200kg。攀爬辅助、搭建庇护所、制作陷阱、绑扎装备',耐久度:100,易损度:5},
  { id:'钢丝锯',icon:'🪚',名称:'钢丝锯',重量:0.2,分类:'工具',描述:'灵活的钢丝锯条——可切割木材和塑料。可改造成远程切割陷阱',耐久度:95,易损度:10},
  { id:'指南针',icon:'🧭',名称:'指南针',重量:0.05,分类:'工具',描述:'磁场混乱区可能失灵——但大多数时候比看苔藓靠谱',易损度:5},
  { id:'工具刀',icon:'🔪',名称:'多功能工具刀',重量:0.15,分类:'工具',描述:'瑞士军刀型——小刀、开罐器、螺丝刀、剪刀集于一身',耐久度:100,易损度:5},
  { id:'折叠铲',icon:'🪏',名称:'折叠铲',重量:0.6,分类:'工具',描述:'挖掘、劈砍、甚至当煎锅用——多功能生存工具',耐久度:100,易损度:10},
  { id:'信号镜',icon:'🪞',名称:'信号镜',重量:0.05,分类:'工具',描述:'反射阳光发出求救信号——晴日可视距离达数十公里',易损度:5},
  { id:'哨子',icon:'🪈',名称:'哨子',重量:0.01,分类:'工具',描述:'远距离声音信号——比喊叫省力且传播更远',易损度:5},
  { id:'针线包',icon:'🪡',名称:'针线包',重量:0.05,分类:'工具',描述:'修补撕裂的衣物、帐篷、背包——在荒野中延长装备寿命的关键',易损度:5},
  { id:'笔记本',icon:'📓',名称:'笔记本+铅笔×2',重量:0.1,分类:'工具',描述:'记录路线、配方、药草识别——好记性不如烂笔头',易损度:5},
  { id:'磨刀石',icon:'🪨',名称:'磨刀石(小)',重量:0.15,分类:'工具',描述:'恢复刀刃锋利度——钝了的斧头和猎刀在荒野中事倍功半',易损度:5},
  { id:'撬棍',icon:'🔧',名称:'撬棍',重量:0.5,分类:'工具',描述:'撬开卡住的舱门、箱子、移动重物——金属杠杆永不失效',耐久度:100,易损度:10},
  { id:'钳子',icon:'🔧',名称:'多功能钳子',重量:0.2,分类:'工具',描述:'夹取、弯折金属线、剪断铁丝——制作陷阱机关的精密工具',耐久度:100,易损度:10},
  { id:'卷尺',icon:'📏',名称:'卷尺5m',重量:0.1,分类:'工具',描述:'精确测量——判断庇护所尺寸、估算水深、丈量陷阱间距',易损度:5},
  { id:'刮刀',icon:'🔪',名称:'铲刀/刮刀',重量:0.15,分类:'工具',描述:'剥树皮取纤维、清理皮革、刮除铁锈——精细加工的利器',耐久度:100,易损度:5},
  // 容器 (11)
  { id:'金属水壶',icon:'🍶',名称:'金属水壶1L',重量:0.3,分类:'容器',描述:'可直接在篝火上加热——煮沸生水、烹饪、化雪取水',容量:1,易损度:15},
  { id:'折叠水袋',icon:'💧',名称:'折叠水袋3L',重量:0.1,分类:'容器',描述:'轻便但不可加热——适合储水运输。空袋几乎不占空间',容量:3,易损度:-5},
  { id:'净水片',icon:'💊',名称:'净水片×20',重量:0.05,分类:'容器',描述:'每片可净化1L水——无需煮沸。但化学味道有些人不太喜欢',数量:20,易损度:-5},
  { id:'铝锅',icon:'🍲',名称:'小铝锅0.8L',重量:0.25,分类:'容器',描述:'轻便烹饪锅——煮粥、炖汤、煎肉',容量:0.8,易损度:15},
  { id:'皮水囊',icon:'🫗',名称:'皮水囊2L',重量:0.2,分类:'容器',描述:'传统皮制水囊——耐久但不透明，无法判断水质',容量:2,易损度:-5},
  { id:'折叠水桶',icon:'🪣',名称:'折叠水桶5L',重量:0.3,分类:'容器',描述:'大量储水运输——从溪流到营地的最佳运水工具',容量:5,易损度:15},
  { id:'保温杯',icon:'☕',名称:'保温杯0.5L',重量:0.3,分类:'容器',描述:'保温但不耐火——不可直接加热。寒冷清晨喝一口热水是巨大的精神慰藉',容量:0.5,易损度:-5},
  { id:'竹筒',icon:'🎋',名称:'粗竹筒2L',重量:0.15,分类:'容器',描述:'天然容器——可加热(需隔火)。时间久了会开裂',容量:2,易损度:-5},
  { id:'玻璃瓶',icon:'🧴',名称:'玻璃瓶(带密封盖)',重量:0.2,分类:'容器',描述:'密封储存干燥食材或药粉——透明可观察内容物',易损度:-10},
  { id:'兽皮水袋',icon:'🫗',名称:'兽皮水袋(手工)',重量:0.15,分类:'容器',描述:'手工缝制的兽皮水袋——天然材料，耐久但需定期维护',容量:1.5,易损度:-5},
  { id:'折叠杯',icon:'🥤',名称:'折叠杯×2',重量:0.1,分类:'容器',描述:'轻便的硅胶折叠杯——热饮冷饮皆宜',数量:2,易损度:-5},
  // 食物 (14)
  { id:'压缩饼干',icon:'🍪',名称:'压缩饼干×7',重量:0.7,分类:'食物',描述:'高热量军用干粮——每块约300kcal。极度吸水，吃后口渴感加剧',数量:7,易损度:-5},
  { id:'能量棒',icon:'🍫',名称:'能量棒×5',重量:0.3,分类:'食物',描述:'轻便快速能量——巧克力花生味。每根约200kcal',数量:5,易损度:-5},
  { id:'盐罐',icon:'🧂',名称:'盐罐',重量:0.3,分类:'食物',描述:'满满一罐细盐——调味、腌渍肉类延长保存×3-5。荒野硬通货',易损度:-5},
  { id:'军用口粮',icon:'🥫',名称:'军用口粮×3',重量:0.9,分类:'食物',描述:'含主食+配菜+加热包——完整的野外热餐。每份约800kcal',数量:3,易损度:-5},
  { id:'脱水蔬菜',icon:'🥬',名称:'脱水蔬菜包×4',重量:0.2,分类:'食物',描述:'营养补充——热水泡发即可。长期只吃肉会缺乏维生素',数量:4,易损度:-5},
  { id:'糖包',icon:'🍬',名称:'糖包×10',重量:0.2,分类:'食物',描述:'快速能量+调味——可冲热饮。每包约100kcal',数量:10,易损度:-5},
  { id:'咖啡粉',icon:'☕',名称:'咖啡粉(小罐)',重量:0.1,分类:'食物',描述:'提神醒脑——寒冷清晨的一杯热咖啡。约15杯份',易损度:-5},
  { id:'牛肉干',icon:'🥩',名称:'牛肉干×6',重量:0.3,分类:'食物',描述:'高蛋白便携肉干——耐保存。每条约80kcal',数量:6,易损度:-5},
  { id:'坚果包',icon:'🥜',名称:'坚果混合包',重量:0.25,分类:'食物',描述:'高热量高脂肪——核桃杏仁腰果。约1500kcal',易损度:-5},
  { id:'蜂蜜',icon:'🍯',名称:'蜂蜜(小瓶)',重量:0.2,分类:'食物',描述:'天然防腐+高能量+调味——可外敷小伤口抗菌。约300g',易损度:-5},
  { id:'巧克力',icon:'🍫',名称:'黑巧克力×3',重量:0.15,分类:'食物',描述:'高能量精神慰藉——可可含量72%。荒野中的奢侈品',数量:3,易损度:-5},
  { id:'茶叶',icon:'🍃',名称:'茶叶(小罐)',重量:0.05,分类:'食物',描述:'热茶暖身提神——茉莉花茶。在荒野中闻到这个味道会想起主人',易损度:-5},
  { id:'维生素片',icon:'💊',名称:'维生素片×30',重量:0.03,分类:'食物',描述:'全面的维生素和矿物质补充——每天一粒。长期缺乏蔬果的救星',数量:30,易损度:-5},
  { id:'即食汤料',icon:'🍜',名称:'即食汤料×4',重量:0.15,分类:'食物',描述:'热水冲泡即成热汤——在寒冷夜晚的心理慰藉远超其营养价值',数量:4,易损度:-5},
  // 庇护 (11)
  { id:'帐篷',icon:'⛺',名称:'双人帐篷',重量:2.5,分类:'庇护',描述:'完整的双人帐篷——外袋略潮湿内部干燥。笨重但在深秋荒野是最可靠的庇护基础',耐久度:100,易损度:0},
  { id:'保温毯',icon:'🥈',名称:'铝箔保温毯',重量:0.1,分类:'庇护',描述:'折叠完好——反射体热和篝火热辐射。可与帐篷组合成保温毯帐篷',耐久度:100,易损度:0},
  { id:'雨衣',icon:'🧥',名称:'防水雨衣',重量:0.3,分类:'庇护',描述:'深秋荒野必备——湿透是失温最大杀手。可兼作防水布',耐久度:100,易损度:0},
  { id:'睡袋',icon:'🛌',名称:'轻便睡袋',重量:1.2,分类:'庇护',描述:'夜间保暖的关键——舒适温标5°C，极限温标-5°C',耐久度:100,易损度:0},
  { id:'防水布',icon:'🏕️',名称:'防水布2m×2m',重量:0.4,分类:'庇护',描述:'多用途——搭建临时庇护所、收集雨水、包裹物资防潮',耐久度:100,易损度:0},
  { id:'救生毯',icon:'🥈',名称:'应急救生毯×2',重量:0.15,分类:'庇护',描述:'极轻极薄——口袋大小。单次使用约可维持体温2-3小时',数量:2,易损度:0},
  { id:'防潮垫',icon:'🟫',名称:'防潮垫',重量:0.5,分类:'庇护',描述:'隔绝地面寒气和湿气——睡眠时地面导热是体温流失的主因',耐久度:100,易损度:0},
  { id:'纱网',icon:'🕸️',名称:'蚊帐/纱网',重量:0.2,分类:'庇护',描述:'深秋昆虫已少——但可用于制作简易渔网或过滤大颗粒杂质',耐久度:90,易损度:0},
  { id:'地钉',icon:'📌',名称:'地钉×6',重量:0.3,分类:'庇护',描述:'铝合金Y型地钉——固定帐篷和防水布。在硬地或沙地中稳固',耐久度:100,易损度:10},
  { id:'绳扣',icon:'🪢',名称:'登山绳扣×4',重量:0.1,分类:'庇护',描述:'快速固定和调节绳索张力——搭建庇护所的效率工具',易损度:0},
  { id:'充气枕头',icon:'🛏️',名称:'充气枕头',重量:0.08,分类:'庇护',描述:'小小奢侈——但好的睡眠在荒野中不是奢侈是生存必需品',耐久度:100,易损度:0},
  // 武器 (14)
  { id:'短柄斧',icon:'🪓',名称:'短柄斧',重量:0.8,分类:'武器',描述:'砍伐树木、劈柴、防身。荒野中最可靠的伙伴',耐久度:98,锋利度:90,易损度:10},
  { id:'猎刀',icon:'🔪',名称:'猎刀',重量:0.3,分类:'武器',描述:'剥皮、分割猎物、切割材料——比斧头精细。固定刀柄更耐用',耐久度:100,锋利度:95,易损度:10},
  { id:'弹弓',icon:'🏹',名称:'弹弓+弹丸×30',重量:0.3,分类:'武器',描述:'打小型猎物(松鸡/松鼠)——安静且不消耗珍贵弹药。需练习瞄准',耐久度:100,易损度:5},
  { id:'折叠弓',icon:'🏹',名称:'折叠弓+箭×6',重量:0.8,分类:'武器',描述:'可狩猎中型猎物——但需要相当练习。箭矢可回收(约50%找回率)',耐久度:100,易损度:5},
  { id:'鱼叉头',icon:'🔱',名称:'鱼叉头(可绑长杆)',重量:0.2,分类:'武器',描述:'绑上长杆即成鱼叉——溪流中叉鱼。也可用作简易矛防身',易损度:5},
  { id:'投掷矛',icon:'🗡️',名称:'投掷矛×2(轻型)',重量:0.5,分类:'武器',描述:'硬木削尖——可投掷或近身。消耗品——断裂后需重新制作',易损度:5},
  { id:'捕兽夹',icon:'🪤',名称:'捕兽夹(小型)',重量:0.6,分类:'武器',描述:'被动捕猎——放置在兽径上。适合兔/狐/松鸡等小型猎物',耐久度:100,易损度:10},
  { id:'登山镐',icon:'⛏️',名称:'登山镐',重量:0.7,分类:'武器',描述:'攀爬陡坡+防身——镐头可破冰/碎石',耐久度:100,易损度:10},
  { id:'工兵铲',icon:'🪏',名称:'工兵铲',重量:0.9,分类:'武器',描述:'多功能——挖掘、劈砍、锯切。可折叠收纳',耐久度:100,易损度:10},
  { id:'甩棍',icon:'🪯',名称:'甩棍',重量:0.4,分类:'武器',描述:'轻便防身武器——甩出即锁定。威慑大于实际杀伤力',耐久度:100,易损度:10},
  { id:'弹丸包',icon:'🔴',名称:'弹丸补充包×50',重量:0.15,分类:'武器',描述:'弹弓专用钢珠弹丸——安静、可回收(约60%)。小型猎物狩猎用',数量:50,易损度:5},
  { id:'备用弓弦',icon:'🧵',名称:'备用弓弦×2',重量:0.03,分类:'武器',描述:'折叠弓的备用弦——弓弦在潮湿环境中易松弛，备用是必要的',数量:2,易损度:5},
  { id:'匕首',icon:'🗡️',名称:'备用匕首',重量:0.12,分类:'武器',描述:'轻便的备用切割工具——固定刀柄，比猎刀小巧但同样锋利',耐久度:100,锋利度:98,易损度:10},
  { id:'投石器',icon:'🪨',名称:'投石器(简易)',重量:0.08,分类:'武器',描述:'简单的皮制投石器——抛射石子，安静无声。需要练习瞄准',易损度:5},
  // 医疗 (11)
  { id:'急救包',icon:'🩹',名称:'急救包',重量:0.4,分类:'医疗',描述:'含消毒纱布、绷带卷、三角巾、医用胶带、一次性手套、小剪刀',耐久度:100,易损度:-5},
  { id:'蛇药',icon:'🐍',名称:'蛇药×2',重量:0.05,分类:'医疗',描述:'毒蛇咬伤急救——深秋蛇类活动减少但未完全冬眠',数量:2,易损度:-5},
  { id:'抗生素',icon:'💊',名称:'广谱抗生素×10',重量:0.05,分类:'医疗',描述:'防止伤口感染恶化——在荒野中感染可能致命。每8小时一粒',数量:10,易损度:-5},
  { id:'止痛药',icon:'💊',名称:'止痛药×12',重量:0.03,分类:'医疗',描述:'缓解疼痛——骨折/重伤时可维持行动能力',数量:12,易损度:-5},
  { id:'酒精片',icon:'🧴',名称:'酒精消毒片×20',重量:0.05,分类:'医疗',描述:'一次性酒精棉片——处理小伤口、消毒工具',数量:20,易损度:-5},
  { id:'缝合包',icon:'🪡',名称:'医用缝合包',重量:0.1,分类:'医疗',描述:'含缝合针+缝合线——处理较深伤口。需要一定技巧和勇气',易损度:-5},
  { id:'烧伤膏',icon:'🧴',名称:'烧伤膏',重量:0.05,分类:'医疗',描述:'处理烧伤/烫伤——篝火旁最容易发生的意外',易损度:-5},
  { id:'止血粉',icon:'✨',名称:'止血粉(小瓶)',重量:0.05,分类:'医疗',描述:'快速止血——撒在伤口上加速凝血。小伤口免缝合',易损度:-5},
  { id:'止泻药',icon:'💊',名称:'止泻药×6',重量:0.03,分类:'医疗',描述:'喝了不干净的水之后可能会有用——腹泻在荒野中是严重脱水风险',数量:6,易损度:-5},
  { id:'抗过敏药',icon:'💊',名称:'抗过敏药×6',重量:0.03,分类:'医疗',描述:'不知名植物的接触过敏——在没有医院的地方这是唯一的防线',数量:6,易损度:-5},
  { id:'眼药水',icon:'👁️',名称:'眼药水',重量:0.02,分类:'医疗',描述:'烟雾、灰尘、异物入眼——在篝火旁做饭时格外需要',易损度:-5},
  // 电子 (8)
  { id:'手机',icon:'📱',名称:'智能手机',重量:0.2,分类:'电子',描述:'电量100%。离线模式——手电筒、指南针APP、相机。无信号但屏幕上的主人照片是珍贵的电量消耗',电量:100,易损度:-10},
  { id:'手摇充电器',icon:'🔋',名称:'手摇充电器',重量:0.15,分类:'电子',描述:'手摇10分钟约+2%电量——虽然效率低但是稳定的电力来源',易损度:-10},
  { id:'太阳能板',icon:'☀️',名称:'太阳能充电板(折叠)',重量:0.3,分类:'电子',描述:'晴天1小时约+5%电量——依赖天气但在有阳光的日子里稳定',易损度:-10},
  { id:'对讲机',icon:'📻',名称:'对讲机(一对)',重量:0.3,分类:'电子',描述:'短距离通讯——但在这片无人荒野中，另一端可能永远是静噪',易损度:-10},
  { id:'收音机',icon:'📻',名称:'便携收音机',重量:0.15,分类:'电子',描述:'接收紧急广播——也许能收到远方的人类信号。需要电池',易损度:-10},
  { id:'充电线',icon:'🔌',名称:'备用充电线',重量:0.05,分类:'电子',描述:'多接口充电线——手机、手电筒、营地灯通用。一根备用线多重保障',易损度:-10},
  { id:'营地灯',icon:'💡',名称:'LED营地灯(小型)',重量:0.2,分类:'电子',描述:'照亮整个营地——比手电筒更适合夜间劳作和烹饪。可调节亮度',耐久度:100,易损度:-10},
  { id:'头灯',icon:'🔦',名称:'LED头灯',重量:0.08,分类:'电子',描述:'解放双手的照明——夜间搭建营地或处理伤口时的最佳选择',耐久度:100,易损度:15},
  // 特殊 (20)
  { id:'钓鱼套装',icon:'🎣',名称:'钓鱼套装',重量:0.1,分类:'特殊',描述:'鱼线+鱼钩+浮漂——在溪流中被动垂钓。抓到鱼就是一顿好饭',易损度:0},
  { id:'放大镜',icon:'🔍',名称:'放大镜',重量:0.05,分类:'特殊',描述:'聚光生火——晴天时比打火机更省资源。也可观察微小痕迹',易损度:0},
  { id:'小镜子',icon:'🪞',名称:'小镜子',重量:0.03,分类:'特殊',描述:'检查伤口、反射阳光发信号、偶尔确认一下自己还是晓光',易损度:-10},
  { id:'蜡烛',icon:'🕯️',名称:'蜡烛×3',重量:0.15,分类:'特殊',描述:'照明+引火辅助——每支约可燃烧4-6小时。比手电筒更有篝火感',数量:3,易损度:0},
  { id:'防水火柴',icon:'🔥',名称:'防水火柴×20',重量:0.03,分类:'特殊',描述:'备用火源——即便浸水后甩干仍可使用。比打火机更可靠(极端天气下)',数量:20,易损度:0},
  { id:'缝纫工具包',icon:'🧵',名称:'缝纫工具包',重量:0.1,分类:'特殊',描述:'修补衣物和帐篷——针+线+顶针+备用纽扣。衣物在荒野中是消耗品',易损度:0},
  { id:'炭笔素描本',icon:'✏️',名称:'炭笔×3+素描本',重量:0.15,分类:'特殊',描述:'记录+画画——在荒野中画看到的动物、植物...和想象中主人找到她的样子',易损度:0},
  { id:'防水地图',icon:'🗺️',名称:'防水地图(本区域)',重量:0.05,分类:'特殊',描述:'标注了北部山脉的粗略地形——虽然比例尺很大但有总比没有好',易损度:0},
  { id:'伞绳手环',icon:'📿',名称:'伞绳手环(5m)',重量:0.05,分类:'特殊',描述:'随身携带的应急绳索——平时作手环，拆开是5m高强度伞绳',易损度:0},
  { id:'口琴',icon:'🎵',名称:'口琴',重量:0.1,分类:'特殊',描述:'精神慰藉——在漫长的独处夜晚吹一首主人喜欢的曲子。对野兽也有威慑作用(也许)',易损度:0},
  { id:'防水袋',icon:'🎒',名称:'防水袋(大)',重量:0.15,分类:'特殊',描述:'卷口式防水袋——保护手机、地图、火柴等怕水的关键物品不被浸湿',易损度:0},
  { id:'望远镜',icon:'🔭',名称:'小型望远镜',重量:0.25,分类:'特殊',描述:'远距离观察地形和野生动物——提前发现水源或危险。8倍放大',易损度:-10},
  { id:'驱虫喷雾',icon:'🧴',名称:'驱虫喷雾',重量:0.1,分类:'特殊',描述:'深秋昆虫虽少但仍有蚊虫——保护睡眠质量的关键',易损度:0},
  { id:'速干毛巾',icon:'🧻',名称:'速干毛巾',重量:0.1,分类:'特殊',描述:'超细纤维速干——擦干身体和尾巴。湿尾在深秋荒野是致命的',易损度:0},
  { id:'气象计',icon:'🌡️',名称:'简易气象计',重量:0.05,分类:'特殊',描述:'测量气压和温度趋势——预测天气变化。比手机更可靠',易损度:-10},
  { id:'登山扣',icon:'🔗',名称:'登山扣×3',重量:0.08,分类:'特殊',描述:'快速挂载装备到背包或腰带上——方便取用常用物品',数量:3,易损度:10},
  { id:'反光贴条',icon:'✨',名称:'反光贴条×10',重量:0.02,分类:'特殊',描述:'贴在背包和庇护所上——夜间用手电筒可以轻松找到营地',数量:10,易损度:0},
  { id:'防水笔记本',icon:'📔',名称:'防水笔记本(备用)',重量:0.08,分类:'特殊',描述:'无论下雨还是涉水都不会损坏——记录生存日志的最后备份',易损度:0},
  { id:'鱼篓',icon:'🧺',名称:'折叠鱼篓',重量:0.2,分类:'特殊',描述:'可折叠的捕鱼篓——放置在溪流中被动捕鱼。比钓鱼更适合长时间等待',易损度:0},
  { id:'浮漂套装',icon:'🎣',名称:'浮漂套装(多尺寸)',重量:0.05,分类:'特殊',描述:'不同水深的钓鱼浮漂——适应溪流、深潭、静水等不同水域',易损度:0},
  // 材料 (9)
  { id:'麻绳',icon:'🪢',名称:'麻绳10m',重量:0.4,分类:'材料',描述:'天然纤维绳索——强度不及尼龙但可生物降解。可用于制作陷阱和绑扎',耐久度:80,易损度:0},
  { id:'帆布',icon:'🏳️',名称:'帆布(小块)',重量:0.3,分类:'材料',描述:'耐用棉麻帆布——可用于制作简易背包、裹脚布、或修补帐篷',易损度:0},
  { id:'铜线',icon:'🔗',名称:'铜线(一卷)',重量:0.15,分类:'材料',描述:'柔性金属线——制作陷阱机关、固定物品',易损度:0},
  { id:'胶水',icon:'🪢',名称:'强力胶(小管)',重量:0.05,分类:'材料',描述:'快速修补——但干了之后只有一管。用在最关键的地方',易损度:0},
  { id:'铁丝',icon:'🔗',名称:'铁丝(一卷)',重量:0.2,分类:'材料',描述:'比铜线更硬——制作大型陷阱框架或加固庇护所结构',耐久度:100,易损度:0},
  { id:'树皮绳',icon:'🪢',名称:'树皮绳(天然)',重量:0.1,分类:'材料',描述:'用树皮纤维手工搓制——强度一般但完全天然，可临时替代绳索',易损度:0},
  { id:'松脂',icon:'🕯️',名称:'松脂(小块)',重量:0.05,分类:'材料',描述:'天然引火加速剂——湿木材沾上松脂也能点燃。也可用于防水处理',易损度:0},
  { id:'燧石',icon:'🪨',名称:'燧石×3',重量:0.15,分类:'材料',描述:'敲击产生火星——在没有打火机时的原始火源。每个可用数百次',易损度:0},
  { id:'桦树皮',icon:'📜',名称:'桦树皮(引火材料)',重量:0.05,分类:'材料',描述:'极佳的天然引火物——薄如纸片，一点即燃。剥自白桦树',易损度:0},
  // 烹饪与饮食 (6)
  { id:'折叠砧板',icon:'🪵',名称:'折叠砧板',重量:0.15,分类:'烹饪',描述:'处理猎物和食材——干净的切割表面。可折叠节省空间',易损度:0},
  { id:'钛合金叉勺',icon:'🥄',名称:'钛合金叉勺',重量:0.03,分类:'烹饪',描述:'比塑料耐久、比钢铁轻——一把搞定汤和固体食物',易损度:0},
  { id:'调料包',icon:'🌿',名称:'调料包(混合香料)',重量:0.08,分类:'烹饪',描述:'盐、胡椒、辣椒粉、蒜粉——让单调的猎物肉变成像样的饭菜',易损度:0},
  { id:'茶蜡',icon:'🕯️',名称:'茶蜡×6',重量:0.1,分类:'烹饪',描述:'小型的稳定火源——每支燃烧4小时。可用于小火加热或保持篝火余烬',易损度:0},
  { id:'折叠烤架',icon:'🍖',名称:'折叠烤架(小型)',重量:0.3,分类:'烹饪',描述:'架在篝火上方的金属烤架——烤肉、烘鱼、晾干衣物',易损度:0},
  { id:'打火棒',icon:'✨',名称:'打火棒(镁棒)',重量:0.05,分类:'烹饪',描述:'没有燃料的火源——刮下镁屑用火星点燃。无限使用次数但有技巧门槛',易损度:0},
];

// ─── 选择逻辑 ───
const selectedIds = ref(new Set<string>());
const activeCategory = ref('');
const safeLimit = computed(() => { const w=50; const c=0.6; const r=0.3; const m=1+(attrs["体质"]-1)*0.08; return Math.round(w*r*c*m*10)/10; });
const catRefs = reactive<Record<string, any>>({});

const categories = ['工具','容器','食物','庇护','武器','医疗','电子','特殊','材料','烹饪'];
const selectedCount = computed(() => selectedIds.value.size);
const availablePositions = [
  { value: '背包', label: '🎒 背包 (舒适6kg/上限12kg)' },
  { value: '腰挂', label: '🔗 腰挂 (舒适1.5kg/上限3kg)' },
  { value: '手持', label: '✋ 手持 (舒适1kg/上限3kg)' },
  { value: '尾藏', label: '🦊 尾藏 (舒适0.3kg/上限1kg)' },
  { value: '颈间', label: '💎 颈间 (舒适0.1kg/上限0.3kg)' },
  { value: '穿着', label: '👘 穿着 (舒适2kg/上限5kg)' },
];
const itemPositions = reactive<Record<string, string>>({});
const carryChoice = reactive<Record<string, string>>({});
const carryAssigned = ref(false);

// Weight calculations for carry-on vs cargo hold
const carryWeight = computed(() => {
  let w = 0;
  for (const id of selectedIds.value) {
    if (carryChoice[id] === 'carry') {
      const item = ITEM_POOL.find(i => i.id === id);
      if (item) w += item.重量 * (item.数量 || 1);
    }
  }
  return w;
});
const cargoHoldWeight = computed(() => totalWeight.value - carryWeight.value);

function hardcoreMode() {
  selectedIds.value = new Set();
  carryAssigned.value = true;
  cargoRolled.value = true;
  cargoResults.value = [];
  toastr.info('硬核模式：晓光将空手面对荒野。祝你好运。');
}
function getItemById(id: string) { return ITEM_POOL.find(i => i.id === id); }

// Cargo salvage
const cargoRolled = ref(false);
const cargoTakenItems = ref<Array<{重量:number}>>([]);
const cargoResults = ref<Array<{id:string;icon:string;名称:string;重量:number;描述:string;survived:boolean;taken:boolean}>>([]);
const CARGO_POOL = [
  { id:'备用燃油',icon:'⛽',名称:'备用燃油(小型1L)',重量:1.2,描述:'航空燃油——引火加速、清洗油污、简易火把',surviveThreshold:35},
  { id:'大型急救箱',icon:'🏥',名称:'机载急救箱(大型)',重量:1.5,描述:'比个人急救包全面——夹板、止血钳、烧伤敷料、吗啡x2',surviveThreshold:45},
  { id:'工具箱',icon:'🧰',名称:'基础工具箱',重量:1.2,描述:'螺丝刀套装、小锤、活动扳手',surviveThreshold:50},
  { id:'救生衣',icon:'🦺',名称:'飞机救生衣',重量:0.3,描述:'可充气——用作浮具、枕头、或拆开取用面料',surviveThreshold:20},
  { id:'座椅垫',icon:'💺',名称:'座椅垫(阻燃)',重量:0.5,描述:'阻燃材料——可剪裁用作跪垫、隔热垫',surviveThreshold:30},
  { id:'航空毛毯',icon:'🧣',名称:'航空毛毯x2',重量:0.8,描述:'阻燃航空毛毯——更轻更保暖。深秋荒野的救命层',surviveThreshold:40},
  { id:'定位发射器',icon:'📡',名称:'紧急定位发射器(损坏)',重量:0.4,描述:'已损坏但零件可用——电池、天线、电路板',surviveThreshold:60},
  { id:'灭火器',icon:'🧯',名称:'机载灭火器(小型)',重量:1.5,描述:'仍有压力——灭火、巨响吓退野兽、金属罐改造容器',surviveThreshold:55},
];
function cargoCondition(roll: number, bonus: number, fragility: number = 0): {label:string, durabilityPct:number, repairable:boolean, dismantlable:boolean} {
  const adjusted = roll + bonus + (fragility || 0);
  if (adjusted >= 80) return {label:'完好',durabilityPct:100,repairable:false,dismantlable:false};
  if (adjusted >= 55) return {label:'少耐久',durabilityPct:40+Math.floor(Math.random()*30),repairable:false,dismantlable:false};
  if (adjusted >= 30) return {label:'部分损坏',durabilityPct:10+Math.floor(Math.random()*20),repairable:true,dismantlable:true};
  return {label:'损坏',durabilityPct:0,repairable:false,dismantlable:true};
}
function rollCargo() {
  cargoRolled.value = true;
  const perception = attrs['感知'];
  const bonus = (perception - 1) * 3;
  const playerCargoItems = ITEM_POOL.filter(i => selectedIds.value.has(i.id) && carryChoice[i.id] === 'cargo');
  const allCargo = [...playerCargoItems, ...CARGO_POOL];
  cargoResults.value = allCargo.map(item => {
    const roll = Math.floor(Math.random() * 100) + 1;
    const cond = cargoCondition(roll, bonus, (item as any).易损度 || 0);
    return { ...item, survived: cond.label !== '损坏', condition: cond, taken: false };
  });
}
function cargoTaken(cargo: any) { return cargo.taken; }
function condBadge(cond: any) {
  if (!cond) return 'badge badge-good';
  if (cond.label === '完好') return 'badge badge-good';
  if (cond.label === '少耐久') return 'badge badge-warn';
  if (cond.label === '部分损坏') return 'badge badge-bad';
  return 'badge badge-bad';
}
function takeCargo(cargo: any) { cargo.taken = true; cargoTakenItems.value.push(cargo); }


const totalWeight = computed(() =>
  ITEM_POOL.filter(i => selectedIds.value.has(i.id)).reduce((sum, i) => sum + i.重量 * (i.数量 || 1), 0),
);
const weightRatio = computed(() => (carryWeight.value / safeLimit.value) * 100);
const weightGradient = computed(() => weightRatio.value > 100 ? 'var(--danger)' : weightRatio.value > 80 ? 'linear-gradient(90deg, var(--success), var(--warning))' : 'var(--success)');

function categoryCount(cat: string) { return ITEM_POOL.filter(i => i.分类 === cat).length; }
function categorySelected(cat: string) { return ITEM_POOL.filter(i => i.分类 === cat && selectedIds.value.has(i.id)).length; }
function itemsByCategory(cat: string) { return ITEM_POOL.filter(i => i.分类 === cat); }
function catEmoji(cat: string) {
  const m: Record<string,string> = { '工具':'🔧','容器':'🫗','食物':'🍞','庇护':'🏕️','武器':'⚔️','医疗':'🩹','电子':'📱','特殊':'📦','材料':'🧱','烹饪':'🍳' };
  return m[cat] || '📦';
}
function jumpToCategory(cat: string) {
  activeCategory.value = activeCategory.value === cat ? '' : cat;
}

function toggleItem(item: ItemOption) {
  if (selectedIds.value.has(item.id)) { selectedIds.value.delete(item.id); }
  else { if (selectedCount.value >= 20) return; selectedIds.value.add(item.id); }
  selectedIds.value = new Set(selectedIds.value);
}

// ─── 负载均衡分析 (智力≥6) ───
const loadPositions = computed(() => {
  const positions: Record<string, number> = { '手持':0, '背包':0, '腰挂':0, '尾藏':0, '颈间':0, '穿着':0, '其他':0 };
  const caps: Record<string,number> = { '手持':3, '背包':12, '腰挂':3, '尾藏':1, '颈间':0.3, '穿着':5, '其他':5 };
  for (const id of selectedIds.value) {
    const item = ITEM_POOL.find(i => i.id === id);
    if (!item) continue;
    // Infer position from item type
    const pos = itemPositions[id] || '背包';
    positions[pos] += item.重量;
  }
  return Object.entries(caps).map(([key, cap]) => {
    const weight = positions[key] || 0;
    return { key, label: key, icon: posIcon(key), weight, cap, pct: Math.min((weight/cap)*100, 100), over: weight > cap };
  });
});
function posIcon(p: string) { const m: Record<string,string> = { '手持':'✋','背包':'🎒','腰挂':'🔗','尾藏':'🦊','颈间':'💎','穿着':'👘','其他':'📦' }; return m[p]||'📦'; }
const balanceLabel = computed(() => {
  const overs = loadPositions.value.filter(p => p.over);
  if (overs.length > 0) return '个别位置超载';
  const total = Object.values(loadPositions.value).reduce((s:number,p:any) => s + p.weight, 0);
  const maxPos = loadPositions.value.reduce((a,b) => a.weight > b.weight ? a : b);
  if (maxPos.weight > total * 0.6) return '分布不均';
  if (maxPos.weight > total * 0.45) return '可接受';
  return '良好分布';
});
const balanceClass = computed(() => {
  if (balanceLabel.value.includes('超载')) return 'badge badge-bad';
  if (balanceLabel.value.includes('不均')) return 'badge badge-warn';
  return 'badge badge-good';
});
const speedMod = computed(() => {
  const base = weightRatio.value > 100 ? -(5 + Math.floor((weightRatio.value-100)/10)*3) : weightRatio.value > 80 ? -5 : 0;
  const balancePenalty = balanceLabel.value.includes('超载') ? -10 : balanceLabel.value.includes('不均') ? -5 : 0;
  return base + balancePenalty;
});
const efficiency = computed(() => {
  const raw = 100 - (weightRatio.value * 0.4) - (balanceLabel.value.includes('超载') ? 20 : balanceLabel.value.includes('不均') ? 10 : 0);
  return Math.max(20, Math.round(raw));
});

// ─── 确认 ───
function confirm() {
  if (remainingPoints.value === 0) {
    updateVariablesWith(vars => {
      for (const [key, val] of Object.entries({ ...attrs })) { _.set(vars, `stat_data.晓光.基础属性.${key}`, val); }
      for (const id of selectedIds.value) {
        const item = ITEM_POOL.find(i => i.id === id);
        if (!item) continue;
        const itemData: any = { 名称: item.名称, 分类: item.分类, 重量: item.重量, 位置: itemPositions[id] || '背包', 描述: item.描述 };
        if (item.耐久度 !== undefined) itemData.耐久度 = item.耐久度;
        if (item.使用次数剩余 !== undefined) itemData.使用次数剩余 = item.使用次数剩余;
        if (item.数量 !== undefined) itemData.数量 = item.数量;
        if (item.容量 !== undefined) itemData.容量 = item.容量;
        if (item.锋利度 !== undefined) itemData.锋利度 = item.锋利度;
        if (item.电量 !== undefined) itemData.电量 = item.电量;
        if (item.保暖值 !== undefined) itemData.保暖值 = item.保暖值;
        _.set(vars, `stat_data.装备.物品栏.${id}`, itemData);
      }
      // Write cargo items with condition data
      for (const cargo of cargoResults.value.filter((c:any) => c.taken)) {
        const cond = cargo.condition || {label:'完好',durabilityPct:100};
        const entry: any = { 名称: cargo.名称, 分类: '特殊', 重量: cargo.重量, 位置: '背包', 描述: cargo.描述 };
        entry.耐久度 = cond.durabilityPct || 0;
        if (cond.label === '部分损坏') entry.描述 = cargo.描述 + ' [部分损坏·可修理]';
        if (cond.label === '损坏') entry.描述 = cargo.描述 + ' [严重损坏·可拆解]';
        _.set(vars, `stat_data.装备.物品栏.cargo_${cargo.id}`, entry);
      }
      _.set(vars, 'stat_data.装备.负重.当前', carryWeight.value);
      _.set(vars, 'stat_data.装备.负重.安全上限', safeLimit.value);
      _.set(vars, 'stat_data.$前端操作', `玩家完成了初始设置：选择了${selectedCount.value}件物品(总重${totalWeight.value.toFixed(1)}kg)，属性分配完毕`);
    }, { type: 'message', message_id: getCurrentMessageId() });
    emit('done', { ...attrs }, [...selectedIds.value]);
  }
}
</script>

<style scoped>
.wizard { width: 100%; min-height: 100%; background: var(--bg); display: flex; justify-content: center; padding: 16px; }
.wizard-card { width: 100%; max-width: 680px; }
.wizard-title { font-family: var(--font-display); font-size: 22px; color: var(--accent); text-align: center; margin-bottom: 4px; }
.wizard-sub { text-align: center; color: var(--text-secondary); font-size: 13px; margin-bottom: 20px; line-height: 1.5; }
.subtle { font-weight: normal; font-size: 11px; color: var(--text-secondary); }

/* Attribute */
.attr-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px dashed rgba(140,126,108,0.2); }
.attr-icon { font-size: 20px; width: 30px; text-align: center; }
.attr-label { font-weight: bold; width: 36px; font-size: 13px; }
.attr-desc { font-size: 11px; color: var(--text-secondary); flex: 1; }
.attr-btn { width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--border); background: var(--card); font-size: 18px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; color: var(--text); }
.attr-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.attr-val { width: 28px; text-align: center; font-weight: bold; font-size: 16px; font-family: var(--font-display); }

/* Weight bar */
.weight-bar-card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; }
.weight-bar-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.wbr-label { font-weight: bold; font-size: 13px; }
.wbr-value { font-size: 16px; font-weight: bold; font-family: var(--font-display); }
.wbr-badge { font-size: 11px; padding: 2px 8px; border-radius: 3px; font-weight: bold; }
.wbr-badge.safe { background: rgba(76,175,80,.12); color: var(--success); }
.wbr-badge.warn { background: rgba(226,143,27,.12); color: var(--warning); }
.wbr-badge.over { background: rgba(224,73,60,.1); color: var(--danger); }
.weight-warning { font-size: 11px; color: var(--danger); margin-top: 4px; }
.progress-track { height: 8px; background: rgba(140,126,108,.12); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width .3s; }

/* Load distribution */
.load-card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 12px; margin-bottom: 10px; }
.load-grid { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.load-row { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.load-pos { width: 48px; flex-shrink: 0; }
.load-weight { width: 40px; text-align: right; font-family: var(--font-data); flex-shrink: 0; }
.load-bar-track { flex: 1; height: 6px; background: rgba(140,126,108,.1); border-radius: 3px; overflow: hidden; }
.load-bar-fill { height: 100%; border-radius: 3px; transition: width .3s; }
.load-cap { width: 30px; text-align: right; color: var(--text-secondary); flex-shrink: 0; }
.load-summary { font-size: 12px; padding-top: 6px; border-top: 1px dashed rgba(0,0,0,.06); }

/* Category bar */
.cat-bar { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.cat-chip { padding: 4px 10px; border-radius: 3px; border: 1px solid var(--border); background: var(--card); font-size: 11px; cursor: pointer; color: var(--text-secondary); font-family: var(--font-body); }
.cat-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.cat-count { opacity: 0.6; font-size: 10px; }

/* Category headers */
.cat-header { font-family: var(--font-display); font-size: 14px; font-weight: bold; color: var(--text); margin: 14px 0 6px; padding-bottom: 4px; border-bottom: 1px solid var(--border); }

/* Item grid */
.item-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
@media (min-width: 500px) { .item-grid { grid-template-columns: 1fr 1fr; } }
.item-select-card { background: var(--card); border: 2px solid var(--border); border-radius: 4px; padding: 8px 10px; cursor: pointer; position: relative; transition: all .15s; }
.item-select-card:hover { border-color: var(--accent-light); }
.item-select-card.selected { border-color: var(--accent); background: rgba(168,68,52,0.04); }
.is-icon { font-size: 24px; }
.is-name { font-weight: bold; font-size: 12px; margin: 2px 0; }
.is-weight { font-size: 11px; color: var(--text-secondary); font-family: var(--font-data); }
.is-desc { font-size: 10px; color: var(--text-secondary); margin: 2px 0; line-height: 1.3; }
.is-meta { display: flex; gap: 3px; margin-top: 3px; }
.is-check { position: absolute; top: 6px; right: 8px; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; }

/* Confirm */
.confirm-btn { width: 100%; padding: 14px; margin-top: 20px; background: var(--accent); color: #fff; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; cursor: pointer; font-family: var(--font-display); }
.confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.chip { padding: 3px 8px; border-radius: 3px; font-size: 10px; background: var(--nav); color: var(--text-secondary); border: 1px solid var(--border); }

.hardcore-btn { padding: 8px 20px; background: var(--text); color: var(--bg); border: 2px solid var(--border); border-radius: 4px; font-size: 14px; cursor: pointer; font-family: var(--font-display); font-weight: bold; }
.hardcore-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

/* Carry-on vs cargo */
.risk-warning { font-size: 11px; color: var(--warning); background: rgba(226,143,27,0.08); padding: 8px 10px; border-radius: 4px; border-left: 3px solid var(--warning); margin-bottom: 10px; line-height: 1.4; }
.weight-split { display: flex; gap: 16px; font-size: 12px; margin-bottom: 10px; padding: 6px 0; }
.carry-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px dashed rgba(140,126,108,0.15); }
.carry-icon { font-size: 20px; width: 28px; text-align: center; }
.carry-name { font-weight: bold; font-size: 12px; width: 80px; flex-shrink: 0; }
.carry-weight { font-size: 11px; color: var(--text-secondary); font-family: var(--font-data); width: 40px; }
.carry-actions { display: flex; gap: 4px; margin-left: auto; }
.carry-btn { padding: 4px 10px; border-radius: 3px; border: 1px solid var(--border); background: var(--card); font-size: 11px; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
.carry-btn.on-person.active { background: rgba(76,175,80,0.15); color: var(--success); border-color: var(--success); font-weight: bold; }
.carry-btn.cargo.active { background: rgba(226,143,27,0.12); color: var(--warning); border-color: var(--warning); font-weight: bold; }


.cond-good { background:rgba(76,175,80,.12);color:var(--success); }
.cond-warn { background:rgba(226,143,27,.12);color:var(--warning); }
.cond-bad { background:rgba(224,73,60,.1);color:var(--danger); }


</style>

/* Hardcore mode */
