<template>
  <div v-if="Object.keys(wounds).length === 0" class="card" style="font-size:12px;color:var(--text-secondary);text-align:center;">
    暂无伤口 — 保持安全！
  </div>
  <div
    v-for="(w, key) in wounds"
    :key="key"
    :class="['card', severityClass(w.严重度), { 'wound-healed': w.愈合阶段 === '已愈合' || w.愈合阶段 === '留疤' }]"
  >
    <div class="wound-header">
      <span><DotBadge :kind="severityBadge(w.严重度)">{{ w.严重度 }}</DotBadge> <strong>{{ key }}</strong></span>
      <span style="font-size:11px;color:var(--text-secondary);">{{ w.位置 }} · {{ w.愈合阶段 }}</span>
    </div>
    <div class="wound-meta">
      <DotBadge :kind="infectionBadge(w.感染风险)">{{ w.感染风险 === '已感染' ? '已感染' : '感染' + w.感染风险 }}</DotBadge>
      <span class="wound-progress">受伤第 {{ w.受伤天数 }} 天 / 预计 {{ w.预计愈合天数 }} 天</span>
    </div>
    <div class="wound-detail">{{ w.对行动影响 }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import DotBadge from '../shared/DotBadge.vue';

type BadgeKind = 'good' | 'warn' | 'bad' | 'info' | 'accent';

const store = useDataStore();
const wounds = computed(() => store.data.晓光?.伤口 ?? {});

const SEVERITY: Record<string, { cls: string; badge: BadgeKind }> = {
  危急: { cls: 'card-danger', badge: 'bad' },
  严重: { cls: 'card-danger', badge: 'bad' },
  中度: { cls: 'card-warn', badge: 'warn' },
  轻微: { cls: 'card-good', badge: 'good' },
};
const SEVERITY_DEFAULT = { cls: 'card-good', badge: 'good' as BadgeKind };

const INFECTION_BADGE: Record<string, BadgeKind> = {
  低: 'good',
  中: 'warn',
  高: 'bad',
  已感染: 'bad',
};

function severityClass(s: string) {
  return (SEVERITY[s] ?? SEVERITY_DEFAULT).cls;
}
function severityBadge(s: string): BadgeKind {
  return (SEVERITY[s] ?? SEVERITY_DEFAULT).badge;
}
function infectionBadge(s: string): BadgeKind {
  return INFECTION_BADGE[s] ?? 'info';
}
</script>

<style scoped>
.wound-header { display: flex; justify-content: space-between; align-items: center; }
.wound-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.wound-progress { font-size: 11px; color: var(--text-secondary); }
.wound-detail { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
.wound-healed { opacity: 0.6; }
</style>
