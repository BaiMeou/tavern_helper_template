<template>
  <div v-if="wounds.length === 0" class="card" style="font-size:12px;color:var(--text-secondary);text-align:center;">
    暂无伤口 — 保持安全！
  </div>
  <div v-for="(w, key) in wounds" :key="key" :class="['card', severityClass(w.严重度)]">
    <div class="wound-header">
      <span><DotBadge :kind="severityBadge(w.严重度)">{{ w.严重度 }}</DotBadge> <strong>{{ key }}</strong></span>
      <span style="font-size:11px;color:var(--text-secondary);">{{ w.位置 }} · {{ w.愈合阶段 }}</span>
    </div>
    <div class="wound-detail">{{ w.对行动影响 }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import DotBadge from '../shared/DotBadge.vue';

const store = useDataStore();
const wounds = computed(() => store.data.晓光?.伤口 ?? {});

function severityClass(s: string) {
  if (s === '危急' || s === '严重') return 'card-danger';
  if (s === '中度') return 'card-warn';
  return 'card-good';
}
function severityBadge(s: string): 'good' | 'warn' | 'bad' | 'info' | 'accent' {
  if (s === '危急' || s === '严重') return 'bad';
  if (s === '中度') return 'warn';
  return 'good';
}
</script>

<style scoped>
.wound-header { display: flex; justify-content: space-between; align-items: center; }
.wound-detail { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
</style>
