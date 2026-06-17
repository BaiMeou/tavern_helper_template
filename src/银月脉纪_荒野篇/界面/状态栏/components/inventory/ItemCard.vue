<template>
  <div :class="['item-card', hasAccent ? 'item-accent' : '']">
    <span class="item-icon">{{ icon }}</span>
    <div class="item-body">
      <div class="item-name">{{ name }}</div>
      <div class="item-desc">{{ desc }}</div>
      <div class="item-meta">
        <DotBadge v-for="b in badges" :key="b.text" :kind="b.kind">{{ b.text }}</DotBadge>
        <span v-for="c in chips" :key="c" class="chip">{{ c }}</span>
      </div>
    </div>
    <div class="item-side">
      <span v-if="weight" class="item-weight">{{ weight }}</span>
      <span v-if="location" class="item-location">{{ location }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import DotBadge from '../shared/DotBadge.vue';

defineProps<{
  icon: string;
  name: string;
  desc: string;
  weight?: string;
  location?: string;
  badges?: { text: string; kind: 'good' | 'warn' | 'bad' | 'info' | 'accent' }[];
  chips?: string[];
  hasAccent?: boolean;
}>();
</script>

<style scoped>
.item-card {
  display: flex; gap: 10px; align-items: center;
  background: var(--card); border: 1px solid var(--border); border-radius: 4px;
  padding: 10px; margin-bottom: 6px; box-shadow: var(--shadow-sm); transition: all .15s;
}
.item-card:hover { box-shadow: var(--shadow); border-color: var(--accent-light); }
.item-card.item-accent { border-left: 3px solid var(--accent); }
.item-icon { font-size: 28px; flex-shrink: 0; width: 40px; text-align: center; }
.item-body { flex: 1; min-width: 0; }
.item-name { font-weight: bold; font-size: 13px; margin-bottom: 2px; }
.item-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.item-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.item-side { text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.item-weight { font-size: 12px; color: var(--text-secondary); font-family: var(--font-data); }
.item-location { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: var(--nav); color: var(--text-secondary); }
.chip { padding: 3px 8px; border-radius: 3px; font-size: 10px; background: var(--nav); color: var(--text-secondary); border: 1px solid var(--border); }
</style>
