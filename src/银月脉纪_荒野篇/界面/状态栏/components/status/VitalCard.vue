<template>
  <div :class="['vital-card', accentClass]">
    <div class="vc-icon">{{ icon }}</div>
    <div class="vc-label">{{ label }}</div>
    <div class="vc-value">
      {{ value }}<span class="vc-unit" v-if="unit">{{ unit }}</span>
    </div>
    <div class="vc-trend" :style="{ color: trendColor }">{{ trend }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  icon: string;
  label: string;
  value: number | string;
  unit?: string;
  trend: string;
  accent?: 'danger' | 'warning' | 'success' | 'info' | 'accent';
}>();

const accentClass = computed(() => props.accent ?? '');
const trendColor = computed(() => {
  if (props.trend.includes('↓')) return 'var(--danger)';
  if (props.trend.includes('↑')) return 'var(--success)';
  return 'var(--text-secondary)';
});
</script>

<style scoped>
.vital-card {
  background: var(--card);
  border-radius: 4px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--border);
  box-shadow: var(--shadow-sm);
}
.vital-card.danger { border-left-color: var(--danger); }
.vital-card.danger .vc-value { color: var(--danger); }
.vital-card.warning { border-left-color: var(--warning); }
.vital-card.warning .vc-value { color: var(--warning); }
.vital-card.success { border-left-color: var(--success); }
.vital-card.success .vc-value { color: var(--success); }
.vital-card.info { border-left-color: var(--info); }
.vital-card.info .vc-value { color: var(--info); }
.vital-card.accent { border-left-color: var(--accent); }
.vital-card.accent .vc-value { color: var(--accent); }

.vc-icon { font-size: 18px; margin-bottom: 2px; }
.vc-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.vc-value { font-size: 24px; font-weight: bold; font-family: var(--font-display); margin: 2px 0; }
.vc-unit { font-size: 14px; font-weight: normal; color: var(--text-secondary); }
.vc-trend { font-size: 11px; }
</style>
