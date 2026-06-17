<template>
  <div class="progress-track">
    <div
      class="progress-fill"
      :style="{
        width: percentage + '%',
        background: gradient || defaultGradient,
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    current: number;
    max: number;
    gradient?: string;
  }>(),
  { gradient: '' },
);

const percentage = computed(() =>
  Math.min(100, Math.max(0, (props.current / props.max) * 100)),
);

const defaultGradient = computed(() => {
  if (percentage.value > 70) return 'var(--success)';
  if (percentage.value > 40) return 'var(--warning)';
  return 'var(--danger)';
});
</script>

<style scoped>
.progress-track {
  height: 10px;
  background: rgba(140, 126, 108, 0.12);
  border-radius: 5px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s;
}
</style>
