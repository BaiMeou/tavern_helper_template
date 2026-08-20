<template>
  <div class="vh-card" :class="kind">
    <div class="vh-top">
      <span class="vh-label">{{ label }}<InfoI v-if="term" :term="term" /></span>
      <span class="vh-ico">{{ icon }}</span>
    </div>
    <div class="vh-val">{{ display }}<span v-if="unit" class="u">{{ unit }}</span></div>
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
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 11px 13px;
  border-left: 3px solid var(--border);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.7) inset,
    0 1px 3px rgba(44,37,32,0.07),
    0 2px 6px rgba(44,37,32,0.05);
  position: relative;
  transition: transform 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out), border-color 0.2s;
}
.vh-card.bad {
  border-left-color: var(--danger);
  border-color: rgba(224, 73, 60, 0.45);
  background: linear-gradient(135deg, #fffdf9, #fff5f4);
  animation: dangerPulse 1.6s ease-in-out infinite;
}
.vh-card.warn {
  border-left-color: var(--warning);
  border-color: rgba(226, 143, 27, 0.45);
  background: linear-gradient(135deg, #fffdf9, #fffbf4);
  animation: warnPulse 1.8s ease-in-out infinite;
}
.vh-card.good {
  border-left-color: var(--success);
}
.vh-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.vh-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.vh-label {
  font-size: 10px;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.vh-ico {
  font-size: 16px;
  animation: float 3s ease-in-out infinite;
}
.vh-card.bad .vh-ico {
  animation: shake 0.8s ease-in-out infinite;
}
.vh-val {
  font-family: var(--font-display);
  font-size: 27px;
  font-weight: 700;
  line-height: 1.1;
  margin-top: 3px;
  transition: color 0.3s;
}
.vh-card.bad .vh-val {
  color: var(--danger);
}
.vh-card.warn .vh-val {
  color: #b06f12;
}
.vh-val .u {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}
.vh-bar {
  height: 5px;
  background: rgba(140, 126, 108, 0.14);
  border-radius: 3px;
  margin-top: 7px;
  overflow: hidden;
}
.vh-bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s var(--ease-out);
}
.vh-card.bad .vh-bar i {
  background: linear-gradient(90deg, #b8403a, #e0493c);
}
.vh-card.warn .vh-bar i {
  background: linear-gradient(90deg, #b06f12, #e28f1b);
}
.vh-card.good .vh-bar i {
  background: linear-gradient(90deg, #3d8b40, #4caf50);
}
.vh-trend {
  font-size: 10px;
  margin-top: 5px;
  transition: color 0.3s;
}
.vh-card.bad .vh-trend {
  color: var(--danger);
}
.vh-card.warn .vh-trend {
  color: #b06f12;
}
</style>
