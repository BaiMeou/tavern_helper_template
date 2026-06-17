<template>
  <div class="stat-row">
    <div class="stat-hdr">
      <span>{{ icon }} {{ label }}</span>
      <span>{{ current }} / {{ max }} <span v-if="xp !== undefined" class="stat-xp-label">XP {{ xp }}/100</span></span>
    </div>
    <div class="stat-dots">
      <div
        v-for="i in max"
        :key="i"
        :class="['stat-dot', i <= fillNormal ? 'fill-norm' : '', i <= fillActive ? 'fill' : '']"
      ></div>
    </div>
    <div v-if="xp !== undefined" class="xp-bar">
      <div class="xp-fill" :style="{ width: xp + '%' }"></div>
    </div>
    <div v-if="desc" class="stat-desc">{{ desc }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  current: number;
  max?: number;
  fillActive: number;
  fillNormal?: number;
  xp?: number;
  desc?: string;
}>();
</script>

<style scoped>
.stat-row { margin-bottom: 8px; }
.stat-hdr { display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 3px; }
.stat-xp-label { font-size: 10px; color: var(--text-secondary); font-weight: normal; }
.stat-dots { display: flex; gap: 2px; height: 10px; background: rgba(140,126,108,.12); padding: 2px; border-radius: 2px; }
.stat-dot { flex: 1; height: 100%; border-radius: 1px; background: rgba(140,126,108,.08); transition: background .3s; }
.stat-dot.fill-norm { background: var(--text-secondary); }
.stat-dot.fill { background: var(--accent); }
.xp-bar { height: 3px; background: rgba(140,126,108,.1); border-radius: 2px; margin-top: 2px; overflow: hidden; }
.xp-fill { height: 100%; background: rgba(168,68,52,.25); border-radius: 2px; transition: width .5s; }
.stat-desc { font-size: 10px; color: var(--text-secondary); margin-top: 2px; }
</style>
