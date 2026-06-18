<template>
  <div class="data-row">
    <span class="dr-label">
      <slot name="label">{{ label }}</slot>
      <InfoI v-if="term" :term="term" />
    </span>
    <span class="dr-val" :class="kind">
      <slot>{{ value }}</slot>
      <span v-if="$slots.sub || sub" class="dr-sub"><slot name="sub">{{ sub }}</slot></span>
    </span>
  </div>
</template>

<script setup lang="ts">
import InfoI from './InfoI.vue';
defineProps<{
  label?: string;
  value?: string | number;
  sub?: string;
  term?: string;
  kind?: 'good' | 'warn' | 'bad';
}>();
</script>

<style scoped>
.data-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0; border-bottom: 1px dashed rgba(140,126,108,.22); font-size: 12px;
}
.data-row:last-child { border-bottom: none; }
.dr-label { display: flex; align-items: center; gap: 5px; color: var(--text-secondary); }
.dr-val { font-family: var(--font-data); font-weight: 500; text-align: right; }
.dr-val.good { color: var(--success); }
.dr-val.warn { color: #b06f12; }
.dr-val.bad { color: var(--danger); }
.dr-sub {
  font-size: 10px; color: var(--text-secondary);
  font-family: var(--font-body); font-weight: normal; margin-left: 4px;
}
</style>
