<template>
  <div class="panel">
    <!-- Header -->
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

    <!-- Vital Grid -->
    <div class="sec-hdr">📊 生存体征</div>
    <div class="vital-grid">
      <VitalCard icon="🍗" label="饥饿度" :value="s('饥饿', 85)" unit="%" trend="→ 稳定" />
      <VitalCard icon="💧" label="口渴度" :value="s('口渴', 55)" unit="%" trend="↓ 下降中" accent="danger" />
      <VitalCard icon="⚡" label="精力值" :value="s('精力', 38)" unit="%" trend="↓ 连续劳作" accent="warning" />
      <VitalCard icon="🌡️" label="体温" :value="s('体温', 36.8)" unit="°C" trend="→ 稳定" accent="success" />
      <VitalCard icon="❤️" label="健康度" :value="s('健康', 78)" unit="%" trend="→ 擦伤结痂" />
      <VitalCard icon="🧠" label="精神" :value="s('精神', 75)" unit="%" trend="→ 执念稳固" accent="accent" />
    </div>

    <!-- Attributes -->
    <div class="sec-hdr">📈 身体属性</div>
    <div class="attr-grid">
      <StatDotBar
        v-for="attr in attributes" :key="attr.key"
        v-bind="attr"
      />
    </div>

    <!-- Body condition -->
    <div class="sec-hdr">🩹 身体状况</div>
    <WoundList />
    <div class="card">
      <div class="fatigue-line">
        <span>😴 疲劳</span>
        <span>肌肉 {{ s('肌肉疲劳', 35) }}% · 睡眠债务 {{ s('睡眠债务', 4) }}h · {{ t('累积负荷', '疲惫') }}</span>
      </div>
    </div>
    <div class="card card-accent">
      <div class="fatigue-line">
        <span class="badge badge-good">稳固</span>
        <span>执念强度 {{ s('强度', 85) }}%</span>
      </div>
      <div class="spirit-quote">{{ t('核心锚点', '铃铛还在就还有家') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import VitalCard from './VitalCard.vue';
import StatDotBar from './StatDotBar.vue';
import WoundList from './WoundList.vue';

const store = useDataStore();
const d = computed(() => store.data);

const s = (path: string, fallback: number) =>
  _.get(d.value, `晓光.生存状态.${path}`, fallback);
const sp = (path: string, fallback: number) =>
  _.get(d.value, `晓光.属性成长.${path}`, fallback);
const t = (path: string, fallback: string) =>
  _.get(d.value, `世界.时间.${path}`, fallback) || fallback;

const a = (key: string, fallback: number) =>
  _.get(d.value, `晓光.基础属性.${key}`, fallback);

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
.fatigue-line { display: flex; justify-content: space-between; font-size: 12px; }
.spirit-quote { font-size: 12px; font-style: italic; margin-top: 6px; }
</style>
