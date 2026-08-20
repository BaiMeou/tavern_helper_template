<template>
  <div class="panel">
    <div class="card card-accent header-card">
      <div class="header-avatar">🦊</div>
      <div class="header-info">
        <div class="header-name-row">
          <span class="header-name">晓光</span>
          <span class="header-day">第{{ t('天数', 0) }}天 · {{ t('时段', '清晨') }} · {{ t('天气', '阴') }}</span>
        </div>
        <div class="chips">
          <span class="chip">九尾白狐娘</span><span class="chip">14岁</span> <span class="chip">162cm / 50kg</span
          ><span class="chip">C罩杯</span>
        </div>
        <div class="header-loc">📍 {{ 当前位置 }}</div>
      </div>
    </div>

    <div class="sec-hdr">📊 生存体征</div>
    <div class="vital-grid">
      <VitalCard
        icon="🍗"
        label="饥饿度"
        :value="s('饥饿', 0)"
        unit="%"
        :trend="trend('饥饿')"
        :accent="vitalAccent(s('饥饿'))"
      />
      <VitalCard
        icon="💧"
        label="口渴度"
        :value="s('口渴', 0)"
        unit="%"
        :trend="trend('口渴')"
        :accent="vitalAccent(s('口渴'))"
      />
      <VitalCard
        icon="⚡"
        label="精力值"
        :value="s('精力', 0)"
        unit="%"
        :trend="trend('精力')"
        :accent="vitalAccent(s('精力'))"
      />
      <VitalCard icon="🌡️" label="核心体温" :value="体温" unit="°C" :trend="体温Trend" :accent="体温Accent" />
      <VitalCard
        icon="❤️"
        label="健康度"
        :value="s('健康', 0)"
        unit="%"
        :trend="trend('健康')"
        :accent="vitalAccent(s('健康'))"
      />
      <VitalCard icon="🧠" label="精神" :value="s('精神', 0)" unit="%" :trend="精神Trend" :accent="精神Accent" />
    </div>

    <!-- 🧍 身体地图：女性人形轮廓 + 伤口点 -->
    <div class="sec-hdr">🧍 身体地图</div>
    <div class="body-map">
      <svg class="body-map-svg" viewBox="0 0 120 200" aria-label="身体地图">
        <!-- 头部 -->
        <circle
          cx="60"
          cy="25"
          r="18"
          fill="rgba(140,126,108,0.08)"
          stroke="rgba(140,126,108,0.4)"
          stroke-width="1.5"
        />
        <!-- 颈部 -->
        <line x1="60" y1="43" x2="60" y2="52" stroke="rgba(140,126,108,0.4)" stroke-width="1.5" />
        <!-- 躯干（梯形） -->
        <polygon
          points="42,52 78,52 86,125 34,125"
          fill="rgba(140,126,108,0.08)"
          stroke="rgba(140,126,108,0.4)"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <!-- 左臂 -->
        <path
          d="M42,58 Q22,75 18,108"
          fill="none"
          stroke="rgba(140,126,108,0.4)"
          stroke-width="1.5"
          stroke-linecap="round"
        />
        <!-- 右臂 -->
        <path
          d="M78,58 Q98,75 102,108"
          fill="none"
          stroke="rgba(140,126,108,0.4)"
          stroke-width="1.5"
          stroke-linecap="round"
        />
        <!-- 左腿 -->
        <path
          d="M46,125 Q38,155 32,190"
          fill="none"
          stroke="rgba(140,126,108,0.4)"
          stroke-width="1.5"
          stroke-linecap="round"
        />
        <!-- 右腿 -->
        <path
          d="M74,125 Q82,155 88,190"
          fill="none"
          stroke="rgba(140,126,108,0.4)"
          stroke-width="1.5"
          stroke-linecap="round"
        />
        <!-- 伤口脉冲点 -->
        <circle
          v-for="w in 伤口点"
          :key="w.key"
          :cx="w.x"
          :cy="w.y"
          :r="w.r"
          class="body-wound"
          @click="clickWound(w.key)"
        >
          <title>{{ w.key }} · {{ w.位置 }} · {{ w.严重度 }}</title>
        </circle>
      </svg>
      <div class="body-map-label">
        <span v-if="伤口点.length">🔴 红点为伤口 · 点击查看详情</span>
        <span v-else>✅ 暂无伤口</span>
      </div>
    </div>

    <!-- ⚖️ 体温热平衡天平：$热量收入 vs $热量散失 -->
    <div class="sec-hdr">⚖️ 体温热平衡</div>
    <div class="heat-balance">
      <div class="hb-side in">
        <div class="hb-title">热量收入</div>
        <div class="hb-items">
          <b>总计 {{ 热量收入 }}W</b><br />
          代谢产热 {{ 代谢产热 }}W<br />
          篝火辐射 {{ 篝火产热 }}W
        </div>
      </div>
      <div class="hb-balance" :class="热平衡状态">⚖️</div>
      <div class="hb-side out">
        <div class="hb-title">热量散失</div>
        <div class="hb-items">
          <b>总计 {{ 热量散失 }}W</b><br />
          对流+辐射+蒸发
        </div>
      </div>
    </div>
    <div class="heat-net" :style="{ color: 热净额 >= 0 ? 'var(--success)' : 'var(--danger)' }">
      {{ 热净额 >= 0 ? `净盈余 ${热净额}W · 体温平稳` : `净失 ${Math.abs(热净额)}W · 体温下降中` }}
    </div>

    <!-- 🥗 营养摄入环形图：蛋白质/脂肪/碳水 -->
    <div class="sec-hdr">🥗 营养摄入</div>
    <div class="nutrition-rings">
      <div v-for="r in 营养环" :key="r.label" class="nut-ring-wrap">
        <div style="position: relative">
          <svg class="nut-ring-svg" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(140,126,108,.12)" stroke-width="5" />
            <circle
              cx="30"
              cy="30"
              r="24"
              fill="none"
              :stroke="r.color"
              stroke-width="5"
              stroke-linecap="round"
              :stroke-dasharray="nutCir"
              :stroke-dashoffset="r.offset"
            />
          </svg>
          <div class="nut-ring-center">{{ r.pct }}%</div>
        </div>
        <div class="nut-ring-label">{{ r.label }} {{ r.gram }}g</div>
      </div>
    </div>

    <!-- 😴 睡眠分析：睡眠债务/质量/上次睡眠时长 -->
    <div class="sec-hdr">😴 睡眠分析</div>
    <div class="sleep-card">
      <div class="sleep-head">
        <span>睡眠债务</span>
        <span
          class="sleep-debt-val"
          :style="{ color: 睡眠债务 > 8 ? 'var(--danger)' : 睡眠债务 > 4 ? 'var(--warning)' : 'var(--success)' }"
          >{{ 睡眠债务 }} 小时</span
        >
      </div>
      <div class="sleep-bar">
        <div class="sleep-seg" :style="{ width: 睡眠条占比 + '%', background: 睡眠条色 }">已睡 {{ 上次睡眠时长 }}h</div>
        <div class="sleep-seg sleep-seg-gap" style="flex: 1">缺 {{ Math.max(0, 推荐睡眠 - 上次睡眠时长) }}h</div>
      </div>
      <div class="sleep-foot">
        质量：<span class="badge" :class="睡眠质量Badge">{{ 睡眠质量 }}</span> · 上次睡眠 {{ 上次睡眠时长 }}h · 推荐
        {{ 推荐睡眠 }}h
        <span v-if="睡眠中断 && 睡眠中断 !== '尚未入睡'"> · 中断：{{ 睡眠中断 }}</span>
      </div>
    </div>

    <!-- 🧠 精神事件时间线：晓光.心理状态.精神事件 -->
    <div class="sec-hdr">🧠 精神事件时间线</div>
    <div class="card">
      <div v-if="精神事件列表.length === 0" class="mental-empty">暂无记录</div>
      <div v-else class="mental-timeline">
        <div v-for="ev in 精神事件列表" :key="ev.key" class="mental-event" :class="ev.cls">
          <div class="mental-event-time">{{ ev.时间 }}</div>
          <div class="mental-event-text">
            {{ ev.内容 }}<span v-if="ev.影响"> · {{ ev.影响 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="sec-hdr">📈 身体属性</div>
    <div class="attr-grid">
      <StatDotBar v-for="attr in attributes" :key="attr.key" v-bind="attr" />
    </div>

    <DetailFold title="体温与冷暖">
      <DataRow label="核心体温" :value="`${体温.toFixed(1)}°C`" term="核心体温" />
      <DataRow
        label="体感温度"
        :value="`${体感.toFixed(1)}°C`"
        :kind="体感 <= 0 ? 'bad' : 体感 < 5 ? 'warn' : 'good'"
        term="体感温度"
      />
      <DataRow label="气温" :value="`${气温.toFixed(1)}°C`" />
      <DataRow label="风把体感拉低" :value="`${风寒.toFixed(1)}°C`" :kind="'warn'" term="风寒指数" />
      <DataRow label="衣物保暖补偿" :value="`${衣物补偿.toFixed(1)}°C`" :kind="'good'" term="体感温度" />
      <DataRow label="篝火带来的暖意" :value="`${火补偿}°C`" />
      <DataRow
        label="每秒散失的热量"
        :value="`${散热速率}W`"
        :kind="散热速率 > 80 ? 'bad' : 散热速率 > 60 ? 'warn' : 'good'"
        term="散热速率"
      />
      <DataRow
        label="距离失温还差"
        :value="失温余量"
        :kind="失温余量.includes('危险') ? 'bad' : 失温余量.includes('注意') ? 'warn' : 'good'"
        term="距失温阈值"
      />
      <DataRow
        label="预计失温时间"
        :value="预计失温分钟 < 999 ? `约${预计失温分钟}分钟` : '不适用'"
        :kind="预计失温分钟 < 30 ? 'bad' : 预计失温分钟 < 120 ? 'warn' : 'good'"
      />
      <Formula>体感温度 = 气温 − 风的拉低 + 衣物保暖×层次权重×(1−湿度衰减)×(1−破损度) + 火 + 庇护所</Formula>
    </DetailFold>

    <DetailFold title="营养代谢（入不敷出）">
      <DataRow
        label="今日吃下的热量"
        :value="`${卡路里} / ${bmr + 活动} kcal`"
        :kind="卡路里 < bmr + 活动 ? 'warn' : 'good'"
        term="今日卡路里"
      />
      <DataRow label="每日基本耗能" :value="`${bmr} kcal/天`" term="基础代谢率" />
      <DataRow
        label="蛋白质 摄入 vs 需求"
        :value="`${蛋白}g / ${蛋白需求}g`"
        :kind="蛋白 < 蛋白需求 ? 'warn' : 'good'"
        term="蛋白质平衡"
      />
      <DataRow label="脂肪 / 碳水" :value="`${脂肪}g / ${碳水}g`" />
      <DataRow label="体脂储备" :value="`${体脂}%`" :kind="体脂 < 10 ? 'warn' : 'good'" term="体脂储备" />
      <DataRow label="今日水分流失" :value="`约 ${水分} mL`" :kind="水分 > 2000 ? 'warn' : 'good'" term="水分流失" />
      <Formula v-if="卡路里 < bmr + 活动"
        >缺口 {{ bmr + 活动 - 卡路里 }} kcal/天 → 动用体脂储备 · 长期将日渐消瘦</Formula
      >
      <Formula v-else>摄入充足，体脂得以维持</Formula>
    </DetailFold>

    <div class="sec-hdr">🩹 伤病</div>
    <WoundList />
    <DiseaseList />

    <div class="card">
      <div class="fatigue-line">
        <span>😴 疲劳</span>
        <span
          >肌肉 {{ f('肌肉疲劳', 0) }}%<InfoI term="肌肉疲劳" /> · 睡眠债务 {{ 睡眠债务 }}h<InfoI term="睡眠债务" /> ·
          <b>{{ f('累积负荷', '—') }}</b
          ><InfoI term="累积负荷"
        /></span>
      </div>
    </div>
    <div class="card card-accent">
      <div class="fatigue-line">
        <span class="badge" :class="执念Badge">{{ ob('状态', '稳固') }}</span>
        <span>执念强度 {{ ob('强度', 0) }}%</span>
      </div>
      <div class="spirit-quote">{{ ob('核心锚点', '铃铛还在就还有家——主人一定在找晓光') }}</div>
    </div>

    <div class="sec-hdr">🦊 狐族特性</div>
    <div class="card" style="font-size: 12px; line-height: 1.8">
      狐尾湿度：<span class="badge" :class="湿度Badge">{{ 狐尾湿度 }}</span> &nbsp; 九尾状态：<span class="chip">{{
        九尾状态
      }}</span
      ><br />
      <!-- 灵力核心：纯数值 + 动态满格（详情） -->
      <div class="lingli-detail">
        <span class="badge" :class="灵力等级Badge">✨ 灵力·{{ 灵力等级 }}</span>
        <span style="font-size: 11px; color: var(--text-secondary)">
          {{ 灵力值 }} / 满格 {{ 灵力满格参考 }}（峰值 {{ 灵力峰值 }}）· 恢复×{{ 恢复倍率 }}
        </span>
      </div>
      <div class="lingli-detail-bar">
        <div class="lingli-detail-fill" :style="{ width: 灵力条占比 + '%' }"></div>
      </div>
      <span style="font-size: 11px; color: var(--text-secondary)">
        灵力缓冲：负重惩罚 ×{{ 灵力缓冲系数 }}（灵力越高越能扛重）· 灵脉：{{ 灵脉强度 }} </span
      ><InfoI term="灵力" /><br />
      <span v-if="九尾裹身有效 !== undefined" :class="['badge', 九尾裹身有效 ? 'badge-good' : 'badge-warn']">{{
        九尾裹身有效 ? '九尾裹身有效' : '狐尾湿透·裹身失效'
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import VitalCard from './VitalCard.vue';
import StatDotBar from './StatDotBar.vue';
import WoundList from './WoundList.vue';
import DiseaseList from './DiseaseList.vue';
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';
import Formula from '../shared/Formula.vue';
import InfoI from '../shared/InfoI.vue';

const store = useDataStore();
const d = computed<any>(() => store.data);

const s = (path: string, fallback: number) => _.get(d.value, `晓光.生存状态.${path}`, fallback);
const sp = (path: string, fallback: number) => _.get(d.value, `晓光.属性成长.${path}`, fallback);
const t = (path: string, fallback: string) => _.get(d.value, `世界.时间.${path}`, fallback) || fallback;
// 位置真路径在 地形.当前位置，不在 时间.当前位置 —— 旧版读错路径导致永远显示 "—"
const 当前位置 = computed(() => _.get(d.value, '世界.地形.当前位置', '') || '—');
const f = (path: string, fallback: any) => _.get(d.value, `晓光.疲劳.${path}`, fallback);
const ob = (path: string, fallback: any) => _.get(d.value, `晓光.执念.${path}`, fallback);
const a = (key: string, fallback: number) => _.get(d.value, `晓光.基础属性.${key}`, fallback);

const 体温 = computed(() => s('体温', 36.8));
const 体感 = computed(() => d.value.$体感温度 ?? 0);
const 风寒 = computed(() => d.value.$风寒拉低 ?? 0);
const 衣物补偿 = computed(() => d.value.$衣物补偿 ?? 0);
const 火补偿 = computed(() => d.value.$火补偿 ?? 0);
const 散热速率 = computed(() => d.value.$散热速率 ?? 0);
const 预计失温分钟 = computed(() => d.value.$预计失温分钟 ?? 999);
const 气温 = computed(() => _.get(d.value, '世界.天气详情.温度', 0));
const 失温余量 = computed(() => {
  const 阈值 = d.value.$距失温阈值 ?? 0;
  const 风险 = d.value.$失温风险等级 ?? '正常';
  if (风险 === '极高' || 风险 === '高') return `危险 ${阈值}°C`;
  if (风险 === '偏高') return `注意 ${阈值}°C`;
  return `安全 ${阈值}°C`;
});

const 精神区间 = computed(() => d.value.晓光?.$精神区间 ?? '稳定');
const 精神Trend = computed(() => {
  const v = s('精神', 0);
  if (精神区间.value === '崩溃' || 精神区间.value === '临界') return `⚠ ${精神区间.value}`;
  if (v < 50) return '↓ 压抑';
  if (v >= 80) return '→ 稳定';
  return '→ 平稳';
});
const 精神Accent = computed<'danger' | 'warning' | 'success' | 'accent'>(() => {
  if (精神区间.value === '崩溃' || 精神区间.value === '临界') return 'danger';
  if (精神区间.value === '压抑') return 'warning';
  return 'success';
});

const 体温Trend = computed(() => {
  const v = 体温.value;
  if (v < 35) return `⚠ 失温 ${v.toFixed(1)}°`;
  if (v < 36) return `↓ 偏低 ${v.toFixed(1)}°`;
  return `→ 正常 ${v.toFixed(1)}°`;
});
const 体温Accent = computed<'danger' | 'warning' | 'success'>(() =>
  体温.value < 35 ? 'danger' : 体温.value < 36 ? 'warning' : 'success',
);

// 营养
const 营养 = computed(() => d.value.晓光?.营养代谢 ?? {});
const 摄入 = computed(() => 营养.value.今日摄入 ?? {});
const 卡路里 = computed(() => 摄入.value.卡路里 ?? 0);
const 蛋白 = computed(() => 摄入.value.蛋白质克 ?? 0);
const 脂肪 = computed(() => 摄入.value.脂肪克 ?? 0);
const 碳水 = computed(() => 摄入.value.碳水克 ?? 0);
const bmr = computed(() => 营养.value.基础代谢率 ?? 1450);
const 活动 = computed(() => {
  const v = f('肌肉疲劳', 35);
  return v > 50 ? 600 : v > 25 ? 300 : 0;
});
const 蛋白需求 = computed(() => d.value.$蛋白质需求 ?? 0);
const 体脂 = computed(() => 营养.value.体脂储备 ?? 18);
const 水分 = computed(() => d.value.$水分流失 ?? 0);

const 睡眠债务 = computed(() => _.get(d.value, '晓光.睡眠.睡眠债务', f('睡眠债务', 4)));
const 狐尾湿度 = computed(() => _.get(d.value, '晓光.狐类特性.狐尾湿度', '干燥'));
const 九尾状态 = computed(() => _.get(d.value, '晓光.狐类特性.九尾状态', '合并一尾'));
const 灵力环境 = computed(() => _.get(d.value, '晓光.狐类特性.灵力环境', '稀薄'));
// ── 灵力核心详情 ──
const 灵力值 = computed(() => _.get(d.value, '晓光.狐类特性.灵力值', 20));
const 灵力峰值 = computed(() => _.get(d.value, '晓光.狐类特性.灵力峰值', 20));
const 灵力满格参考 = computed(() => d.value.$灵力满格参考 ?? Math.max(灵力峰值.value, 灵力值.value, 50));
const 灵力等级 = computed(() => d.value.$灵力等级 ?? '未知');
const 恢复倍率 = computed(() => d.value.$恢复倍率 ?? 1);
const 灵力缓冲系数 = computed(() => d.value.$灵力缓冲系数 ?? 1);
const 灵脉强度 = computed(() => _.get(d.value, '世界.地形.灵脉强度', '正常'));
const 灵力条占比 = computed(() => Math.max(0, Math.min(100, (灵力值.value / 灵力满格参考.value) * 100)));
const 灵力等级Badge = computed(() => {
  const lv = 灵力等级.value;
  if (lv === '枯竭') return 'badge-bad';
  if (lv === '稀薄') return 'badge-warn';
  if (lv === '全盛' || lv === '旺盛') return 'badge-good';
  return 'badge-warn';
});
const 九尾裹身有效 = computed(() => d.value.$九尾裹身有效);

const 湿度Badge = computed(() =>
  狐尾湿度.value === '湿透' ? 'badge-bad' : 狐尾湿度.value === '微湿' ? 'badge-warn' : 'badge-good',
);
const 执念Badge = computed(() => {
  const st = ob('状态', '稳固');
  if (st === '崩溃') return 'badge-bad';
  if (st === '动摇') return 'badge-warn';
  return 'badge-good';
});

function vitalAccent(v: number): 'danger' | 'warning' | 'success' | 'accent' {
  if (v <= 25) return 'danger';
  if (v <= 50) return 'warning';
  return 'success';
}
function trend(key: string): string {
  const v = s(key as any, 50);
  if (v <= 25) return '⚠ 严重偏低';
  if (v <= 50) return '↓ 需关注';
  return '→ 平稳';
}

const attributes = computed(() => [
  {
    icon: '💪',
    label: '体质',
    current: a('体质', 0),
    max: 20,
    fillActive: a('体质', 0),
    xp: sp('体质XP', 0),
    desc: '负重恢复 · 伤病抵抗',
  },
  {
    icon: '🏃',
    label: '敏捷',
    current: a('敏捷', 0),
    max: 20,
    fillActive: a('敏捷', 0),
    xp: sp('敏捷XP', 0),
    desc: '移动闪避 · 捕猎攀爬',
  },
  {
    icon: '🧠',
    label: '智力',
    current: a('智力', 0),
    max: 20,
    fillActive: 0,
    fillNormal: a('智力', 0),
    desc: '配方解锁 · 思维加速',
  },
  {
    icon: '🛡️',
    label: '意志',
    current: a('意志', 0),
    max: 20,
    fillActive: 0,
    fillNormal: a('意志', 0),
    xp: sp('意志XP', 0),
    desc: '精神耐力 · 孤独抗性',
  },
  {
    icon: '👁️',
    label: '感知',
    current: a('感知', 0),
    max: 20,
    fillActive: 0,
    fillNormal: a('感知', 0),
    xp: sp('感知XP', 0),
    desc: '环境察觉 · 追踪预警',
  },
]);

// ── 身体地图：部位 → SVG 坐标映射（viewBox 0 0 120 200）──
const BODY_PARTS: Record<string, { x: number; y: number }> = {
  头部: { x: 60, y: 25 },
  左臂: { x: 52, y: 65 },
  右臂: { x: 68, y: 65 },
  胸部: { x: 60, y: 70 },
  腹部: { x: 60, y: 90 },
  左腿: { x: 50, y: 150 },
  右腿: { x: 70, y: 150 },
  左手: { x: 18, y: 108 },
  右手: { x: 102, y: 108 },
};

// 伤口点：遍历 晓光.伤口，按 位置 映射到身体坐标；位置未匹配则跳过（详情仍见下方 WoundList）
const 伤口点 = computed(() => {
  const ws = d.value.晓光?.伤口 ?? {};
  const out: { key: string; x: number; y: number; r: number; 严重度: string; 位置: string }[] = [];
  for (const [key, w] of Object.entries(ws)) {
    const pos = BODY_PARTS[w.位置];
    if (!pos) continue;
    const sev: string = w.严重度 ?? '轻微';
    const r = sev === '危急' || sev === '严重' ? 6 : sev === '中度' ? 5 : 4;
    out.push({ key, x: pos.x, y: pos.y, r, 严重度: sev, 位置: w.位置 });
  }
  return out;
});
function clickWound(key: string) {
  _.set(d.value, '$前端操作', '玩家查看伤口: ' + key);
}

// ── 体温热平衡天平：$热量收入 vs $热量散失（隐变量，schema transform 派生）──
const 热量收入 = computed(() => d.value.$热量收入 ?? 0);
const 热量散失 = computed(() => d.value.$热量散失 ?? 0);
const 热净额 = computed(() => 热量收入.value - 热量散失.value);
const 热平衡状态 = computed(() => (热净额.value >= 0 ? 'in-balance' : 'out-balance'));
// 代谢产热基准 75W（schema: $热量收入 = 75 + 火补偿*10 + 保暖*5 + 庇护*3）
const 代谢产热 = 75;
const 篝火产热 = computed(() => (火补偿.value ?? 0) * 10);

// ── 营养摄入环形图：蛋白质/脂肪/碳水，从 晓光.营养代谢.今日摄入 读取 ──
const NUT_C = 2 * Math.PI * 24; // r=24 圆周长 ≈ 150.796
const nutCir = NUT_C.toFixed(1);
// 脂肪/碳水参考每日推荐摄入量（DRI 显示基准，非伪造数据）
const 脂肪参考 = 60;
const 碳水参考 = 250;
const 营养环 = computed(() => {
  const pNeed = 蛋白需求.value > 0 ? 蛋白需求.value : 60;
  const pPct = Math.min(100, Math.round((蛋白.value / pNeed) * 100));
  const fPct = Math.min(100, Math.round((脂肪.value / 脂肪参考) * 100));
  const cPct = Math.min(100, Math.round((碳水.value / 碳水参考) * 100));
  return [
    { label: '蛋白质', pct: pPct, gram: 蛋白.value, color: '#4caf50', offset: NUT_C * (1 - pPct / 100) },
    { label: '脂肪', pct: fPct, gram: 脂肪.value, color: '#e28f1b', offset: NUT_C * (1 - fPct / 100) },
    { label: '碳水', pct: cPct, gram: 碳水.value, color: '#348aa7', offset: NUT_C * (1 - cPct / 100) },
  ];
});

// ── 睡眠分析：从 晓光.睡眠 读取（睡眠债务真源已单源化，复用上方 睡眠债务 computed）──
const 睡眠数据 = computed(() => d.value.晓光?.睡眠 ?? {});
const 上次睡眠时长 = computed(() => 睡眠数据.value.上次睡眠时长 ?? 0);
const 睡眠质量 = computed(() => 睡眠数据.value.睡眠质量 ?? '未睡');
const 睡眠中断 = computed(() => 睡眠数据.value.最近中断 ?? '尚未入睡');
const 推荐睡眠 = 8;
const 睡眠条占比 = computed(() => Math.min(100, (上次睡眠时长.value / 推荐睡眠) * 100));
const 睡眠条色 = computed(() => {
  const q = 睡眠质量.value;
  if (q === '深睡' || q === '正常') return 'var(--success)';
  if (q === '浅眠') return 'var(--warning)';
  if (q === '浅眠断续') return 'var(--danger)';
  return 'rgba(140,126,108,.3)';
});
const 睡眠质量Badge = computed(() => {
  const q = 睡眠质量.value;
  if (q === '深睡' || q === '正常') return 'badge-good';
  if (q === '浅眠') return 'badge-warn';
  if (q === '浅眠断续') return 'badge-bad';
  return 'badge-warn';
});

// ── 精神事件时间线：晓光.心理状态.精神事件 record ──
const 精神事件列表 = computed(() => {
  const evts = d.value.晓光?.心理状态?.精神事件 ?? {};
  return Object.entries(evts)
    .map(([key, e]) => {
      const 类型: string = e.类型 ?? '中性';
      return {
        key,
        时间: e.时间 ?? key,
        内容: e.内容 ?? '',
        类型,
        影响: e.影响 ?? '',
        cls: 类型 === '消极' ? 'bad' : 类型 === '积极' ? 'good' : '',
      };
    })
    .reverse(); // 最新事件在前
});
</script>

<style scoped>
.panel {
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.header-card {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  border-left: 3px solid var(--accent);
}
.header-avatar {
  font-size: 42px;
}
.header-info {
  flex: 1;
}
.header-name-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.header-name {
  font-size: 18px;
  font-weight: bold;
  font-family: var(--font-display);
}
.header-day {
  font-size: 11px;
  color: var(--text-secondary);
}
.header-loc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.vital-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}
.attr-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
@media (max-width: 360px) {
  .attr-grid {
    grid-template-columns: 1fr;
  }
}
.fatigue-line {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  align-items: center;
  gap: 4px;
}
.spirit-quote {
  font-size: 12px;
  font-style: italic;
  margin-top: 6px;
}
/* 灵力详情条 */
.lingli-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.lingli-detail-bar {
  height: 7px;
  border-radius: 4px;
  background: rgba(140, 126, 108, 0.15);
  margin: 5px 0 4px;
  overflow: hidden;
  border: 1px solid rgba(140, 126, 108, 0.2);
}
.lingli-detail-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #348aa7, #6bb6c9 50%, #c9a84c);
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.3, 1);
}
/* ── 新增面板局部样式（基础结构复用 global.css，此处仅补充 global 未覆盖部分）── */
.heat-net {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  margin: -4px 0 10px;
}
.sleep-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}
.sleep-debt-val {
  font-family: var(--font-data);
  font-weight: 700;
}
.sleep-seg-gap {
  background: rgba(140, 126, 108, 0.15);
  color: var(--text-secondary);
}
.sleep-foot {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 6px;
}
.mental-empty {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}
</style>
