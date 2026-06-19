<template>
  <div class="vh-card" :class="kind">
    <div class="vh-top">
      <span class="vh-label">{{ label }}<InfoI v-if="term" :term="term" /></span>
      <span class="vh-ico">{{ icon }}</span>
    </div>
    <div class="vh-val">{{ display }}<span class="u" v-if="unit">{{ unit }}</span></div>
    <div class="vh-bar"><i :style="{ width: pct + '%', background: barColor }"></i></div>
    <div class="vh-trend">{{ trend }}</div>
  </div>
</template>

<script setup lang="ts">
import InfoI from '../shared/InfoI.vue';

const props = defineProps<{
  icon: string; label: string;
  value: number; max?: number;
  kind?: 'good' | 'warn' | 'bad';
  term?: string; trend?: string;
  unit?: string;
}>();

const unit = computed(() => props.unit ?? '%');

const display = computed(() => Math.round(props.value));
const pct = computed(() => {
  const m = props.max ?? 100;
  return Math.max(0, Math.min(100, (props.value / m) * 100));
});
const barColor = computed(() => {
  if (props.kind === 'bad') return 'var(--danger)';
  if (props.kind === 'warn') return 'var(--warning)';
  return 'var(--success)';
});
const trend = computed(() => props.trend ?? trendByValue(props.value));
function trendByValue(v: number) {
  if (v <= 30) return '⚠ 严重偏低';
  if (v <= 60) return '↓ 需关注';
  return '→ 平稳';
}
</script>

<style scoped>
.vh-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 7px;
  padding: 11px 13px; border-left: 3px solid var(--border);
  box-shadow: var(--shadow-sm); position: relative;
}
.vh-card.bad { border-left-color: var(--danger); }
.vh-card.warn { border-left-color: var(--warning); }
.vh-card.good { border-left-color: var(--success); }
.vh-top { display: flex; justify-content: space-between; align-items: center; }
.vh-label {
  font-size: 10px; color: var(--text-secondary); letter-spacing: .5px;
  display: flex; align-items: center; gap: 3px;
}
.vh-ico { font-size: 16px; }
.vh-val {
  font-family: var(--font-display); font-size: 27px; font-weight: 700;
  line-height: 1.1; margin-top: 3px;
}
.vh-val .u { font-size: 13px; font-weight: 400; color: var(--text-secondary); }
.vh-card.bad .vh-val { color: var(--danger); }
.vh-card.warn .vh-val { color: var(--warning); }
.vh-bar {
  height: 5px; background: rgba(140,126,108,.14); border-radius: 3px;
  margin-top: 7px; overflow: hidden;
}
.vh-bar i { display: block; height: 100%; border-radius: 3px; transition: width .5s; }
.vh-trend { font-size: 10px; color: var(--text-secondary); margin-top: 5px; }
</style>
