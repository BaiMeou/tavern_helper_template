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
          <span class="chip">九尾白狐娘</span><span class="chip">14岁</span>
          <span class="chip">162cm / 50kg</span><span class="chip">C罩杯</span>
        </div>
        <div class="header-loc">📍 {{ t('当前位置', '飞机残骸西侧') }}</div>
      </div>
    </div>

    <div class="sec-hdr">📊 生存体征</div>
    <div class="vital-grid">
      <VitalCard icon="🍗" label="饥饿度" :value="s('饥饿', 85)" unit="%" :trend="trend('饥饿')" :accent="vitalAccent(s('饥饿'))" />
      <VitalCard icon="💧" label="口渴度" :value="s('口渴', 55)" unit="%" :trend="trend('口渴')" :accent="vitalAccent(s('口渴'))" />
      <VitalCard icon="⚡" label="精力值" :value="s('精力', 38)" unit="%" :trend="trend('精力')" :accent="vitalAccent(s('精力'))" />
      <VitalCard icon="🌡️" label="核心体温" :value="体温" unit="°C" :trend="体温Trend" :accent="体温Accent" />
      <VitalCard icon="❤️" label="健康度" :value="s('健康', 78)" unit="%" :trend="trend('健康')" :accent="vitalAccent(s('健康'))" />
      <VitalCard icon="🧠" label="精神" :value="s('精神', 75)" unit="%" :trend="精神Trend" :accent="精神Accent" />
    </div>

    <div class="sec-hdr">📈 身体属性</div>
    <div class="attr-grid">
      <StatDotBar v-for="attr in attributes" :key="attr.key" v-bind="attr" />
    </div>

    <DetailFold title="体温与冷暖">
      <DataRow label="核心体温" :value="`${体温.toFixed(1)}°C`" term="核心体温" />
      <DataRow label="体感温度" :value="`${体感.toFixed(1)}°C`" :kind="体感<=0?'bad':体感<5?'warn':'good'" term="体感温度" />
      <DataRow label="气温" :value="`${气温.toFixed(1)}°C`" />
      <DataRow label="风把体感拉低" :value="`${风寒.toFixed(1)}°C`" :kind="'warn'" term="风寒指数" />
      <DataRow label="衣物保暖补偿" :value="`${衣物补偿.toFixed(1)}°C`" :kind="'good'" term="体感温度" />
      <DataRow label="篝火带来的暖意" :value="`${火补偿}°C`" />
      <DataRow label="每秒散失的热量" :value="`${散热速率}W`" :kind="散热速率>80?'bad':散热速率>60?'warn':'good'" term="散热速率" />
      <DataRow label="距离失温还差" :value="失温余量" :kind="失温余量.includes('危险')?'bad':失温余量.includes('注意')?'warn':'good'" term="距失温阈值" />
      <Formula>体感温度 = 气温 − 风的拉低 + 衣物保暖×层次权重×(1−湿度衰减)×(1−破损度) + 火 + 庇护所</Formula>
    </DetailFold>

    <DetailFold title="营养代谢（入不敷出）">
      <DataRow label="今日吃下的热量" :value="`${卡路里} / ${bmr + 活动} kcal`" :kind="卡路里<bmr+活动?'warn':'good'" term="今日卡路里" />
      <DataRow label="每日基本耗能" :value="`${bmr} kcal/天`" term="基础代谢率" />
      <DataRow label="蛋白质 摄入 vs 需求" :value="`${蛋白}g / ${蛋白需求}g`" :kind="蛋白<蛋白需求?'warn':'good'" term="蛋白质平衡" />
      <DataRow label="脂肪 / 碳水" :value="`${脂肪}g / ${碳水}g`" />
      <DataRow label="体脂储备" :value="`${体脂}%`" :kind="体脂<10?'warn':'good'" term="体脂储备" />
      <DataRow label="今日水分流失" :value="`约 ${水分} mL`" :kind="水分>2000?'warn':'good'" term="水分流失" />
      <Formula v-if="卡路里 < bmr + 活动">缺口 {{ bmr + 活动 - 卡路里 }} kcal/天 → 动用体脂储备 · 长期将日渐消瘦</Formula>
      <Formula v-else>摄入充足，体脂得以维持</Formula>
    </DetailFold>

    <div class="sec-hdr">🩹 伤病</div>
    <WoundList />
    <DiseaseList />

    <div class="card">
      <div class="fatigue-line">
        <span>😴 疲劳</span>
        <span>肌肉 {{ f('肌肉疲劳', 35) }}%<InfoI term="肌肉疲劳" /> · 睡眠债务 {{ 睡眠债务 }}h<InfoI term="睡眠债务" /> · <b>{{ f('累积负荷', '疲惫') }}</b><InfoI term="累积负荷" /></span>
      </div>
    </div>
    <div class="card card-accent">
      <div class="fatigue-line">
        <span class="badge" :class="执念Badge">{{ ob('状态', '稳固') }}</span>
        <span>执念强度 {{ ob('强度', 85) }}%</span>
      </div>
      <div class="spirit-quote">{{ ob('核心锚点', '铃铛还在就还有家——主人一定在找晓光') }}</div>
    </div>

    <div class="sec-hdr">🦊 狐族特性</div>
    <div class="card" style="font-size:12px;line-height:1.8">
      狐尾湿度：<span class="badge" :class="湿度Badge">{{ 狐尾湿度 }}</span> &nbsp; 九尾状态：<span class="chip">{{ 九尾状态 }}</span><br>
      灵力环境：<span class="badge badge-bad">{{ 灵力环境 }}</span> &nbsp;<span style="font-size:11px;color:var(--text-secondary)">恢复力降至接近人类</span><InfoI term="灵力环境" />
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
const f = (path: string, fallback: any) => _.get(d.value, `晓光.疲劳.${path}`, fallback);
const ob = (path: string, fallback: any) => _.get(d.value, `晓光.执念.${path}`, fallback);
const a = (key: string, fallback: number) => _.get(d.value, `晓光.基础属性.${key}`, fallback);

const 体温 = computed(() => s('体温', 36.8));
const 体感 = computed(() => d.value.$体感温度 ?? 2);
const 风寒 = computed(() => d.value.$风寒拉低 ?? 5);
const 衣物补偿 = computed(() => d.value.$衣物补偿 ?? 0.5);
const 火补偿 = computed(() => d.value.$火补偿 ?? 0);
const 散热速率 = computed(() => d.value.$散热速率 ?? 82);
const 气温 = computed(() => _.get(d.value, '世界.天气详情.温度', 7));
const 失温余量 = computed(() => {
  const 阈值 = d.value.$距失温阈值 ?? 1.8;
  const 风险 = d.value.$失温风险等级 ?? '正常';
  if (风险 === '极高' || 风险 === '高') return `危险 ${阈值}°C`;
  if (风险 === '偏高') return `注意 ${阈值}°C`;
  return `安全 ${阈值}°C`;
});

const 精神区间 = computed(() => d.value.晓光?.$精神区间 ?? '稳定');
const 精神Trend = computed(() => {
  const v = s('精神', 75);
  if (精神区间.value === '崩溃' || 精神区间.value === '临界') return `⚠ ${精神区间.value}`;
  if (v < 50) return '↓ 压抑';
  if (v >= 80) return '→ 稳定';
  return '→ 平稳';
});
const 精神Accent = computed<'danger'|'warning'|'success'|'accent'>(() => {
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
const 体温Accent = computed<'danger'|'warning'|'success'>(() => 体温.value < 35 ? 'danger' : 体温.value < 36 ? 'warning' : 'success');

// 营养
const 营养 = computed(() => d.value.晓光?.营养代谢 ?? {});
const 摄入 = computed(() => 营养.value.今日摄入 ?? {});
const 卡路里 = computed(() => 摄入.value.卡路里 ?? 0);
const 蛋白 = computed(() => 摄入.value.蛋白质克 ?? 0);
const 脂肪 = computed(() => 摄入.value.脂肪克 ?? 0);
const 碳水 = computed(() => 摄入.value.碳水克 ?? 0);
const bmr = computed(() => 营养.value.基础代谢率 ?? 1450);
const 活动 = computed(() => f('肌肉疲劳', 35) > 50 ? 600 : 300);
const 蛋白需求 = computed(() => d.value.$蛋白质需求 ?? Math.round(0.9 * a('体质', 2) * 5));
const 体脂 = computed(() => 营养.value.体脂储备 ?? 18);
const 水分 = computed(() => d.value.$水分流失 ?? (1300 + (f('肌肉疲劳', 35) > 50 ? 600 : f('肌肉疲劳', 35) > 25 ? 300 : 0) + (气温.value > 20 ? (气温.value - 20) * 40 : 0)));

const 睡眠债务 = computed(() => _.get(d.value, '晓光.睡眠.睡眠债务', f('睡眠债务', 4)));
const 狐尾湿度 = computed(() => _.get(d.value, '晓光.狐类特性.狐尾湿度', '干燥'));
const 九尾状态 = computed(() => _.get(d.value, '晓光.狐类特性.九尾状态', '合并一尾'));
const 灵力环境 = computed(() => _.get(d.value, '晓光.狐类特性.灵力环境', '稀薄'));

const 湿度Badge = computed(() => 狐尾湿度.value === '湿透' ? 'badge-bad' : 狐尾湿度.value === '微湿' ? 'badge-warn' : 'badge-good');
const 执念Badge = computed(() => {
  const st = ob('状态', '稳固');
  if (st === '崩溃') return 'badge-bad';
  if (st === '动摇') return 'badge-warn';
  return 'badge-good';
});

function vitalAccent(v: number): 'danger'|'warning'|'success'|'accent' {
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
  { icon: '💪', label: '体质', current: a('体质', 2), max: 20, fillActive: a('体质', 2), xp: sp('体质XP', 20), desc: '负重恢复 · 伤病抵抗' },
  { icon: '🏃', label: '敏捷', current: a('敏捷', 2), max: 20, fillActive: a('敏捷', 2), xp: sp('敏捷XP', 45), desc: '移动闪避 · 捕猎攀爬' },
  { icon: '🧠', label: '智力', current: a('智力', 8), max: 20, fillActive: 0, fillNormal: a('智力', 8), desc: '配方解锁 · 思维加速' },
  { icon: '🛡️', label: '意志', current: a('意志', 4), max: 20, fillActive: 0, fillNormal: a('意志', 4), xp: sp('意志XP', 10), desc: '精神耐力 · 孤独抗性' },
  { icon: '👁️', label: '感知', current: a('感知', 4), max: 20, fillActive: 0, fillNormal: a('感知', 4), xp: sp('感知XP', 80), desc: '环境察觉 · 追踪预警' },
]);
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.header-card { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; border-left: 3px solid var(--accent); }
.header-avatar { font-size: 42px; }
.header-info { flex: 1; }
.header-name-row { display: flex; justify-content: space-between; align-items: baseline; }
.header-name { font-size: 18px; font-weight: bold; font-family: var(--font-display); }
.header-day { font-size: 11px; color: var(--text-secondary); }
.header-loc { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.vital-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-bottom: 10px; }
.attr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
@media (max-width: 360px) { .attr-grid { grid-template-columns: 1fr; } }
.fatigue-line { display: flex; justify-content: space-between; font-size: 12px; align-items: center; gap: 4px; }
.spirit-quote { font-size: 12px; font-style: italic; margin-top: 6px; }
</style>
