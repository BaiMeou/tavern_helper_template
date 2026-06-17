<template>
  <div class="wizard">
    <div class="wizard-card">
      <h1 class="wizard-title">银月脉纪：荒野篇</h1>
      <p class="wizard-sub">坠机之前，你从残骸中抢救出了什么？<br>你的身体状态如何？</p>

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
        <div class="sec-hdr">🎒 选择初始物品 <span class="subtle">已选 {{ selectedCount }} / 10 件</span></div>

        <!-- Weight bar -->
        <div class="weight-bar-card">
          <div class="weight-bar-row">
            <span class="wbr-label">⚖️ 负重</span>
            <span class="wbr-value">{{ totalWeight.toFixed(1) }} / 9.0 kg</span>
            <span :class="['wbr-badge', weightRatio > 100 ? 'over' : weightRatio > 80 ? 'warn' : 'safe']">
              {{ weightRatio > 100 ? '⚠️ 超重' : weightRatio > 80 ? '满载' : '安全' }}
            </span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: Math.min(weightRatio, 100) + '%', background: weightRatio > 100 ? 'var(--danger)' : weightRatio > 80 ? 'var(--warning)' : 'var(--success)' }"
            ></div>
          </div>
          <div v-if="weightRatio > 100" class="weight-warning">
            ⚠️ 超过安全负重上限！移动速度将大幅下降，体力消耗加速。
          </div>
        </div>

        <!-- Search -->
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索物品..."
          type="text"
        />

        <!-- Category filter -->
        <div class="cat-filters">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="['cat-btn', { active: activeCategory === cat }]"
            @click="activeCategory = activeCategory === cat ? '' : cat"
          >{{ cat }}</button>
        </div>

        <!-- Item grid -->
        <div class="item-grid">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            :class="['item-select-card', { selected: selectedIds.has(item.id) }]"
            @click="toggleItem(item)"
          >
            <div class="is-icon">{{ item.icon }}</div>
            <div class="is-name">{{ item.名称 }}</div>
            <div class="is-weight">{{ item.重量 }}kg</div>
            <div class="is-desc">{{ item.描述 }}</div>
            <div class="is-meta">
              <span v-if="item.耐久度 !== undefined" class="chip">耐久 {{ item.耐久度 }}</span>
              <span v-if="item.使用次数剩余 !== undefined" class="chip">{{ item.使用次数剩余 }}次</span>
              <span v-if="item.数量" class="chip">×{{ item.数量 }}</span>
              <span v-if="item.容量" class="chip">{{ item.容量 }}L</span>
            </div>
            <div v-if="selectedIds.has(item.id)" class="is-check">✓</div>
          </div>
        </div>
      </section>

      <!-- 确认按钮 -->
      <button
        class="confirm-btn"
        :disabled="selectedCount !== 10 || remainingPoints !== 0"
        @click="confirm"
      >
        {{ selectedCount !== 10 ? `还需选择 ${10 - selectedCount} 件物品` :
           remainingPoints !== 0 ? `还需分配 ${remainingPoints} 个属性点` :
           '🦊 开始求生' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';

const emit = defineEmits<{ done: [attrs: Record<string,number>, items: string[]] }>();

// ─── 属性 ───
const attrs = reactive<Record<string,number>>({
  体质: 2, 敏捷: 2, 智力: 8, 意志: 4, 感知: 4,
});
const attributes = [
  { key: '体质', icon: '💪', label: '体质', desc: '负重复原 · 伤病抵抗' },
  { key: '敏捷', icon: '🏃', label: '敏捷', desc: '移动闪避 · 捕猎攀爬' },
  { key: '智力', icon: '🧠', label: '智力', desc: '配方解锁 · 思维加速' },
  { key: '意志', icon: '🛡️', label: '意志', desc: '精神耐力 · 孤独抗性' },
  { key: '感知', icon: '👁️', label: '感知', desc: '环境察觉 · 追踪预警' },
];
const remainingPoints = computed(() => {
  const used = Object.values(attrs).reduce((a, b) => a + b, 0);
  return 20 - used;
});
function adjust(key: string, delta: number) {
  const newVal = attrs[key] + delta;
  if (newVal >= 1 && newVal <= 20 && remainingPoints.value - delta >= 0) {
    attrs[key] = newVal;
  }
}

// ─── 物品池 (75件) ───
interface ItemOption { id: string; icon: string; 名称: string; 重量: number; 分类: string; 描述: string; 耐久度?: number; 使用次数剩余?: number; 数量?: number; 容量?: number; }
const ITEM_POOL: ItemOption[] = [
  // 工具 (12)
  { id:'打火机',icon:'🔥',名称:'防风打火机',重量:0.05,分类:'工具',描述:'可靠的火源——荒野中最珍贵的物品之一',使用次数剩余:100},
  { id:'手电筒',icon:'🔦',名称:'强光手电筒',重量:0.2,分类:'工具',描述:'LED两档亮度。深秋夜晚漫长，每一分钟电量都要精打细算',耐久度:100},
  { id:'绳索10m',icon:'🎗️',名称:'尼龙绳索10m',重量:0.5,分类:'工具',描述:'干燥完好，承重约200kg。攀爬辅助、搭建庇护所、制作陷阱、绑扎装备',耐久度:100},
  { id:'钢丝锯',icon:'🪚',名称:'钢丝锯',重量:0.2,分类:'工具',描述:'灵活的钢丝锯条——可切割木材和塑料。可改造成远程切割陷阱',耐久度:95},
  { id:'指南针',icon:'🧭',名称:'指南针',重量:0.05,分类:'工具',描述:'磁场混乱区可能失灵——但大多数时候比看苔藓靠谱'},
  { id:'工具刀',icon:'🔪',名称:'多功能工具刀',重量:0.15,分类:'工具',描述:'瑞士军刀型——小刀、开罐器、螺丝刀、剪刀集于一身',耐久度:100},
  { id:'折叠铲',icon:'🪏',名称:'折叠铲',重量:0.6,分类:'工具',描述:'挖掘、劈砍、甚至当煎锅用——多功能生存工具',耐久度:100},
  { id:'信号镜',icon:'🪞',名称:'信号镜',重量:0.05,分类:'工具',描述:'反射阳光发出求救信号——晴日可视距离达数十公里'},
  { id:'哨子',icon:'🪈',名称:'哨子',重量:0.01,分类:'工具',描述:'远距离声音信号——比喊叫省力且传播更远'},
  { id:'针线包',icon:'🪡',名称:'针线包',重量:0.05,分类:'工具',描述:'修补撕裂的衣物、帐篷、背包——在荒野中延长装备寿命的关键'},
  { id:'笔记本',icon:'📓',名称:'笔记本+铅笔×2',重量:0.1,分类:'工具',描述:'记录路线、配方、药草识别——好记性不如烂笔头'},
  { id:'磨刀石',icon:'🪨',名称:'磨刀石(小)',重量:0.15,分类:'工具',描述:'恢复刀刃锋利度——钝了的斧头和猎刀在荒野中事倍功半'},
  // 容器 (8)
  { id:'金属水壶',icon:'🍶',名称:'金属水壶1L',重量:0.3,分类:'容器',描述:'可直接在篝火上加热——煮沸生水、烹饪、化雪取水',容量:1},
  { id:'折叠水袋',icon:'💧',名称:'折叠水袋3L',重量:0.1,分类:'容器',描述:'轻便但不可加热——适合储水运输。空袋几乎不占空间',容量:3},
  { id:'净水片',icon:'💊',名称:'净水片×20',重量:0.05,分类:'容器',描述:'每片可净化1L水——无需煮沸。但化学味道有些人不太喜欢',数量:20},
  { id:'铝锅',icon:'🍲',名称:'小铝锅0.8L',重量:0.25,分类:'容器',描述:'轻便烹饪锅——煮粥、炖汤、煎肉',容量:0.8},
  { id:'皮水囊',icon:'🫗',名称:'皮水囊2L',重量:0.2,分类:'容器',描述:'传统皮制水囊——耐久但不透明，无法判断水质',容量:2},
  { id:'折叠水桶',icon:'🪣',名称:'折叠水桶5L',重量:0.3,分类:'容器',描述:'大量储水运输——从溪流到营地的最佳运水工具',容量:5},
  { id:'保温杯',icon:'☕',名称:'保温杯0.5L',重量:0.3,分类:'容器',描述:'保温但不耐火——不可直接加热。寒冷清晨喝一口热水是巨大的精神慰藉',容量:0.5},
  { id:'竹筒',icon:'🎋',名称:'粗竹筒2L',重量:0.15,分类:'容器',描述:'天然容器——可加热(需隔火)。时间久了会开裂',容量:2},
  // 食物 (10)
  { id:'压缩饼干',icon:'🍪',名称:'压缩饼干×7',重量:0.7,分类:'食物',描述:'高热量军用干粮——每块约300kcal。极度吸水，吃后口渴感加剧',数量:7},
  { id:'能量棒',icon:'🍫',名称:'能量棒×5',重量:0.3,分类:'食物',描述:'轻便快速能量——巧克力花生味。每根约200kcal',数量:5},
  { id:'盐罐',icon:'🧂',名称:'盐罐',重量:0.3,分类:'食物',描述:'满满一罐细盐——调味、腌渍肉类延长保存×3-5。荒野硬通货',数量:1},
  { id:'军用口粮',icon:'🥫',名称:'军用口粮×3',重量:0.9,分类:'食物',描述:'含主食+配菜+加热包——完整的野外热餐。每份约800kcal',数量:3},
  { id:'脱水蔬菜',icon:'🥬',名称:'脱水蔬菜包×4',重量:0.2,分类:'食物',描述:'营养补充——热水泡发即可。长期只吃肉会缺乏维生素',数量:4},
  { id:'糖包',icon:'🍬',名称:'糖包×10',重量:0.2,分类:'食物',描述:'快速能量+调味——可冲热饮。每包约100kcal',数量:10},
  { id:'咖啡粉',icon:'☕',名称:'咖啡粉(小罐)',重量:0.1,分类:'食物',描述:'提神醒脑——寒冷清晨的一杯热咖啡是巨大的精神慰藉。约15杯份'},
  { id:'牛肉干',icon:'🥩',名称:'牛肉干×6',重量:0.3,分类:'食物',描述:'高蛋白便携肉干——耐保存。每条约80kcal',数量:6},
  { id:'坚果包',icon:'🥜',名称:'坚果混合包',重量:0.25,分类:'食物',描述:'高热量高脂肪——核桃杏仁腰果。约1500kcal'},
  { id:'蜂蜜',icon:'🍯',名称:'蜂蜜(小瓶)',重量:0.2,分类:'食物',描述:'天然防腐+高能量+调味——可外敷小伤口抗菌。约300g'},
  // 庇护与保暖 (8)
  { id:'帐篷',icon:'⛺',名称:'双人帐篷',重量:2.5,分类:'庇护',描述:'完整的双人帐篷——外袋略潮湿内部干燥。笨重但在深秋荒野是最可靠的庇护基础',耐久度:100},
  { id:'保温毯',icon:'🥈',名称:'铝箔保温毯',重量:0.1,分类:'庇护',描述:'折叠完好——反射体热和篝火热辐射。可与帐篷组合',耐久度:100},
  { id:'雨衣',icon:'🧥',名称:'防水雨衣',重量:0.3,分类:'庇护',描述:'深秋荒野必备——湿透是失温最大杀手。可兼作防水布',耐久度:100},
  { id:'睡袋',icon:'🛌',名称:'轻便睡袋',重量:1.2,分类:'庇护',描述:'夜间保暖的关键——舒适温标5°C，极限温标-5°C',耐久度:100},
  { id:'防水布',icon:'🏕️',名称:'防水布2m×2m',重量:0.4,分类:'庇护',描述:'多用途——搭建临时庇护所、收集雨水、包裹物资防潮',耐久度:100},
  { id:'救生毯',icon:'🥈',名称:'应急救生毯×2',重量:0.15,分类:'庇护',描述:'极轻极薄——口袋大小。单次使用约可维持体温2-3小时',数量:2},
  { id:'防潮垫',icon:'🟫',名称:'防潮垫',重量:0.5,分类:'庇护',描述:'隔绝地面寒气和湿气——睡眠时地面导热是体温流失的主因',耐久度:100},
  { id:'纱网',icon:'🕸️',名称:'蚊帐/纱网',重量:0.2,分类:'庇护',描述:'深秋昆虫已少——但可用于制作简易渔网或过滤大颗粒杂质',耐久度:90},
  // 武器 (10)
  { id:'短柄斧',icon:'🪓',名称:'短柄斧',重量:0.8,分类:'武器',描述:'砍伐树木、劈柴、防身。荒野中最可靠的伙伴',耐久度:98,锋利度:90},
  { id:'猎刀',icon:'🔪',名称:'猎刀',重量:0.3,分类:'武器',描述:'剥皮、分割猎物、切割材料——比斧头精细。固定刀柄更耐用',耐久度:100,锋利度:95},
  { id:'弹弓',icon:'🏹',名称:'弹弓+弹丸×30',重量:0.3,分类:'武器',描述:'打小型猎物(松鸡/松鼠)——安静且不消耗珍贵弹药。需练习瞄准',耐久度:100},
  { id:'折叠弓',icon:'🏹',name:'折叠弓+箭×6',重量:0.8,分类:'武器',描述:'可狩猎中型猎物——但需要相当练习。箭矢可回收(约50%找回率)',耐久度:100},
  { id:'鱼叉头',icon:'🔱',名称:'鱼叉头(可绑长杆)',重量:0.2,分类:'武器',描述:'绑上长杆即成鱼叉——溪流中叉鱼。也可用作简易矛防身'},
  { id:'投掷矛',icon:'🗡️',名称:'投掷矛×2(轻型)',重量:0.5,分类:'武器',描述:'硬木削尖——可投掷或近身。消耗品——断裂后需重新制作'},
  { id:'捕兽夹',icon:'🪤',名称:'捕兽夹(小型)',重量:0.6,分类:'武器',描述:'被动捕猎——放置在兽径上。适合兔/狐/松鸡等小型猎物',耐久度:100},
  { id:'登山镐',icon:'⛏️',名称:'登山镐',重量:0.7,分类:'武器',描述:'攀爬陡坡+防身——镐头可破冰/碎石',耐久度:100},
  { id:'工兵铲',icon:'🪏',名称:'工兵铲',重量:0.9,分类:'武器',描述:'多功能——挖掘、劈砍、锯切、开瓶。可折叠收纳',耐久度:100},
  { id:'甩棍',icon:'🪯',名称:'甩棍',重量:0.4,分类:'武器',描述:'轻便防身武器——甩出即锁定。威慑大于实际杀伤力',耐久度:100},
  // 医疗 (8)
  { id:'急救包',icon:'🩹',名称:'急救包',重量:0.4,分类:'医疗',描述:'含消毒纱布、绷带卷、三角巾、医用胶带、一次性手套、小剪刀。未拆封',耐久度:100},
  { id:'蛇药',icon:'🐍',名称:'蛇药×2',重量:0.05,分类:'医疗',描述:'毒蛇咬伤急救——深秋蛇类活动减少但未完全冬眠',数量:2},
  { id:'抗生素',icon:'💊',名称:'广谱抗生素×10',重量:0.05,分类:'医疗',描述:'防止伤口感染恶化——在荒野中感染可能致命。每8小时一粒',数量:10},
  { id:'止痛药',icon:'💊',名称:'止痛药×12',重量:0.03,分类:'医疗',描述:'缓解疼痛——骨折/重伤时可维持行动能力',数量:12},
  { id:'酒精片',icon:'🧴',名称:'酒精消毒片×20',重量:0.05,分类:'医疗',描述:'一次性酒精棉片——处理小伤口、消毒工具',数量:20},
  { id:'缝合包',icon:'🪡',名称:'医用缝合包',重量:0.1,分类:'医疗',描述:'含缝合针+缝合线——处理较深伤口。需要一定技巧和勇气'},
  { id:'烧伤膏',icon:'🧴',名称:'烧伤膏',重量:0.05,分类:'医疗',描述:'处理烧伤/烫伤——篝火旁最容易发生的意外'},
  { id:'止血粉',icon:'✨',名称:'止血粉(小瓶)',重量:0.05,分类:'医疗',描述:'快速止血——撒在伤口上加速凝血。小伤口免缝合'},
  // 电子 (5)
  { id:'手机',icon:'📱',名称:'智能手机',重量:0.2,分类:'电子',描述:'电量100%。离线模式——手电筒、指南针APP、相机。无信号但屏幕上的主人照片是珍贵的电量消耗',电量:100},
  { id:'手摇充电器',icon:'🔋',名称:'手摇充电器',重量:0.15,分类:'电子',描述:'手摇10分钟约+2%电量——虽然效率低但是稳定的电力来源'},
  { id:'太阳能板',icon:'☀️',名称:'太阳能充电板(折叠)',重量:0.3,分类:'电子',描述:'晴天1小时约+5%电量——依赖天气但在有阳光的日子里稳定'},
  { id:'对讲机',icon:'📻',名称:'对讲机(一对)',重量:0.3,分类:'电子',描述:'短距离通讯——但在这片无人荒野中，另一端可能永远是静噪'},
  { id:'收音机',icon:'📻',名称:'便携收音机',重量:0.15,分类:'电子',描述:'接收紧急广播——也许能收到远方的人类信号。需要电池'},
  // 特殊 (10)
  { id:'钓鱼套装',icon:'🎣',名称:'钓鱼套装',重量:0.1,分类:'特殊',描述:'鱼线+鱼钩+浮漂——在溪流中被动垂钓。荒野中抓到鱼就是一顿好饭'},
  { id:'放大镜',icon:'🔍',名称:'放大镜',重量:0.05,分类:'特殊',描述:'聚光生火——晴天时比打火机更省资源。也可观察微小痕迹'},
  { id:'小镜子',icon:'🪞',名称:'小镜子',重量:0.03,分类:'特殊',描述:'检查伤口、反射阳光发信号、偶尔确认一下自己还是晓光'},
  { id:'蜡烛',icon:'🕯️',名称:'蜡烛×3',重量:0.15,分类:'特殊',描述:'照明+引火辅助——每支约可燃烧4-6小时。比手电筒更有篝火感'},
  { id:'防水火柴',icon:'🔥',名称:'防水火柴×20',重量:0.03,分类:'特殊',描述:'备用火源——即便浸水后甩干仍可使用。比打火机更可靠(在极端天气下)'},
  { id:'缝纫工具包',icon:'🧵',名称:'缝纫工具包',重量:0.1,分类:'特殊',描述:'修补衣物和帐篷——针+线+顶针+备用纽扣。衣物在荒野中是消耗品'},
  { id:'炭笔素描本',icon:'✏️',名称:'炭笔×3+素描本',重量:0.15,分类:'特殊',描述:'记录+画画——晓光画了七年主人。在荒野中也许画下看到的动物、植物...和想象中主人找到她时的样子'},
  { id:'防水地图',icon:'🗺️',名称:'防水地图(本区域)',重量:0.05,分类:'特殊',描述:'标注了北部山脉的粗略地形——虽然比例尺很大但有总比没有好'},
  { id:'伞绳手环',icon:'📿',名称:'伞绳手环(5m)',重量:0.05,分类:'特殊',描述:'随身携带的应急绳索——平时作手环，拆开是5m高强度伞绳'},
  { id:'口琴',icon:'🎵',名称:'口琴',重量:0.1,分类:'特殊',description:'小小的精神慰藉——在漫长的独处夜晚，吹一首主人喜欢的曲子。对野兽也有威慑作用(也许)'},
  // 材料 (4)
  { id:'麻绳',icon:'🪢',名称:'麻绳10m',重量:0.4,分类:'材料',描述:'天然纤维绳索——强度不及尼龙但可生物降解。可用于制作陷阱和绑扎',耐久度:80},
  { id:'帆布',icon:'🏳️',名称:'帆布(小块)',重量:0.3,分类:'材料',描述:'耐用棉麻帆布——可用于制作简易背包、裹脚布、或修补帐篷'},
  { id:'铜线',icon:'🔗',名称:'铜线(一卷)',重量:0.15,分类:'材料',描述:'柔性金属线——制作陷阱机关、固定物品、导电(如有电源)'},
  { id:'胶水',icon:'🪢',名称:'强力胶(小管)',重量:0.05,分类:'材料',描述:'快速修补——但干了之后只有一管。用在最关键的地方'},
];

// ─── 选择逻辑 ───
const selectedIds = ref(new Set<string>());
const searchQuery = ref('');
const activeCategory = ref('');

const categories = ['工具','容器','食物','庇护','武器','医疗','电子','特殊','材料'];
const selectedCount = computed(() => selectedIds.value.size);

const totalWeight = computed(() =>
  ITEM_POOL.filter(i => selectedIds.value.has(i.id))
    .reduce((sum, i) => sum + i.重量 * (i.数量 || 1), 0),
);
const SAFE_LIMIT = 9; // kg
const weightRatio = computed(() => (totalWeight.value / SAFE_LIMIT) * 100);

const filteredItems = computed(() => {
  let items = ITEM_POOL;
  if (activeCategory.value) {
    items = items.filter(i => i.分类 === activeCategory.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    items = items.filter(i =>
      i.名称.toLowerCase().includes(q) ||
      i.描述.toLowerCase().includes(q) ||
      i.分类.toLowerCase().includes(q),
    );
  }
  return items;
});

function toggleItem(item: ItemOption) {
  if (selectedIds.value.has(item.id)) {
    selectedIds.value.delete(item.id);
  } else {
    if (selectedCount.value >= 10) return; // 最多10件
    selectedIds.value.add(item.id);
  }
  // Trigger reactivity
  selectedIds.value = new Set(selectedIds.value);
}

function confirm() {
  if (selectedCount.value === 10 && remainingPoints.value === 0) {
    // Write attributes
    updateVariablesWith(vars => {
      for (const [key, val] of Object.entries({ ...attrs })) {
        _.set(vars, `stat_data.晓光.基础属性.${key}`, val);
      }
      // Write selected items
      for (const id of selectedIds.value) {
        const item = ITEM_POOL.find(i => i.id === id);
        if (!item) continue;
        const itemData: any = {
          名称: item.名称,
          分类: item.分类,
          重量: item.重量,
          位置: '背包',
          描述: item.描述,
        };
        if (item.耐久度 !== undefined) itemData.耐久度 = item.耐久度;
        if (item.使用次数剩余 !== undefined) itemData.使用次数剩余 = item.使用次数剩余;
        if (item.数量 !== undefined) itemData.数量 = item.数量;
        if (item.容量 !== undefined) itemData.容量 = item.容量;
        if (item.锋利度 !== undefined) itemData.锋利度 = item.锋利度;
        if (item.电量 !== undefined) itemData.电量 = item.电量;
        _.set(vars, `stat_data.装备.物品栏.${id}`, itemData);
      }
      _.set(vars, 'stat_data.装备.负重.当前', totalWeight.value);
    }, { type: 'message', message_id: getCurrentMessageId() });

    emit('done', { ...attrs }, [...selectedIds.value]);
  }
}
</script>

<style scoped>
.wizard {
  width: 100%; min-height: 100%;
  background: var(--bg);
  display: flex; justify-content: center;
  padding: 16px;
}
.wizard-card {
  width: 100%; max-width: 640px;
}
.wizard-title {
  font-family: var(--font-display); font-size: 22px; color: var(--accent);
  text-align: center; margin-bottom: 4px;
}
.wizard-sub {
  text-align: center; color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;
  line-height: 1.5;
}
.subtle { font-weight: normal; font-size: 11px; color: var(--text-secondary); }

/* Attribute */
.attr-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; border-bottom: 1px dashed rgba(140,126,108,0.2);
}
.attr-icon { font-size: 20px; width: 30px; text-align: center; }
.attr-label { font-weight: bold; width: 36px; font-size: 13px; }
.attr-desc { font-size: 11px; color: var(--text-secondary); flex: 1; }
.attr-btn {
  width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--border);
  background: var(--card); font-size: 18px; cursor: pointer; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
  color: var(--text);
}
.attr-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.attr-val { width: 28px; text-align: center; font-weight: bold; font-size: 16px; font-family: var(--font-display); }

/* Search */
.search-input {
  width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px;
  background: var(--card); font-size: 13px; margin-bottom: 8px;
  font-family: var(--font-body);
}

/* Category filters */
.cat-filters { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.cat-btn {
  padding: 4px 10px; border-radius: 3px; border: 1px solid var(--border);
  background: var(--card); font-size: 11px; cursor: pointer; color: var(--text-secondary);
}
.cat-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

/* Item grid */
.item-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
@media (min-width: 500px) { .item-grid { grid-template-columns: 1fr 1fr; } }
.item-select-card {
  background: var(--card); border: 2px solid var(--border); border-radius: 4px;
  padding: 8px 10px; cursor: pointer; position: relative; transition: all .15s;
}
.item-select-card:hover { border-color: var(--accent-light); }
.item-select-card.selected { border-color: var(--accent); background: rgba(168,68,52,0.04); }
.is-icon { font-size: 24px; }
.is-name { font-weight: bold; font-size: 12px; margin: 2px 0; }
.is-weight { font-size: 11px; color: var(--text-secondary); font-family: var(--font-data); }
.is-desc { font-size: 10px; color: var(--text-secondary); margin: 2px 0; line-height: 1.3; }
.is-meta { display: flex; gap: 3px; margin-top: 3px; }
.is-check {
  position: absolute; top: 6px; right: 8px;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); color: #fff; font-size: 14px; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
}

/* Confirm */
/* Weight bar */
.weight-bar-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 4px;
  padding: 10px 12px; margin-bottom: 10px;
}
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

.confirm-btn {
  width: 100%; padding: 14px; margin-top: 20px;
  background: var(--accent); color: #fff; border: none; border-radius: 4px;
  font-size: 16px; font-weight: bold; cursor: pointer; font-family: var(--font-display);
}
.confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
