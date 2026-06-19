<template>
  <div v-if="count === 0" class="card" style="font-size:12px;color:var(--text-secondary);text-align:center;">
    暂无疾病 — 保持卫生、不喝生水！
  </div>
  <template v-else>
    <div v-for="(dz, key) in diseases" :key="key" :class="['card', severityClass(dz.严重度)]">
      <div class="wound-header">
        <span><DotBadge :kind="severityBadge(dz.严重度)">{{ dz.严重度 }}</DotBadge> <strong>{{ key }}</strong></span>
        <span style="font-size:11px;color:var(--text-secondary);">{{ dz.阶段 }}</span>
      </div>
      <div class="wound-detail">症状：{{ dz.症状 }}</div>
      <div class="wound-detail" v-if="dz.传染性 !== '无'">
        <DotBadge :kind="dz.传染性 === '高' ? 'bad' : dz.传染性 === '中' ? 'warn' : 'info'">{{ dz.传染性 }}</DotBadge> 传染性
      </div>
      <div class="wound-detail" v-if="dz.处理方式">处理：{{ dz.处理方式 }}</div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import DotBadge from '../shared/DotBadge.vue';

const store = useDataStore();
const diseases = computed(() => store.data.晓光?.疾病 ?? {});
const count = computed(() => Object.keys(diseases.value).length);

function severityClass(s: string) {
  if (s === '危急' || s === '严重') return 'card-danger';
  if (s === '中度') return 'card-warn';
  if (s === '潜伏期') return 'card-info';
  return 'card-good';
}
function severityBadge(s: string): 'good' | 'warn' | 'bad' | 'info' | 'accent' {
  if (s === '危急' || s === '严重') return 'bad';
  if (s === '中度') return 'warn';
  if (s === '潜伏期') return 'info';
  return 'good';
}
</script>

<style scoped>
.wound-header { display: flex; justify-content: space-between; align-items: center; }
.wound-detail { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
</style>
