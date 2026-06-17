<template>
  <div class="panel">
    <div class="sec-hdr">🐾 野兽图鉴</div>
    <div v-if="Object.keys(beasts).length === 0" class="empty-state">尚未遭遇任何生物<br>首次遭遇后 AI 自动创建图鉴条目</div>
    <div v-for="(b, key) in beasts" :key="key" class="card">
      <div class="beast-head">
        <strong>{{ b.名称 }}</strong>
        <span :class="dangerBadge(b.危险等级)">{{ b.危险等级 }}</span>
      </div>
      <div class="beast-detail">{{ b.习性 }} · {{ b.活动时段 }} · 体型{{ b.体型 }}</div>
      <div class="beast-detail">足迹：{{ b.足迹描述 }}</div>
    </div>

    <div class="sec-hdr">🌿 草药药典</div>
    <div v-if="Object.keys(herbs).length === 0" class="empty-state">尚未识别任何药用植物</div>
    <div v-for="(h, key) in herbs" :key="key" class="card">
      <strong>{{ h.名称 }}</strong>
      <div class="beast-detail">{{ h.药用功效 }} · 采集{{ h.采集部位 }} · {{ h.处理方式 }}</div>
    </div>

    <div class="sec-hdr">👣 足迹与痕迹</div>
    <div v-if="Object.keys(tracks).length === 0" class="empty-state">尚未发现明显踪迹</div>
    <div v-for="(t, key) in tracks" :key="key" class="card">
      <strong>{{ t.推测生物 }}</strong> · {{ t.新鲜度 }} · {{ t.方向 }}
      <div class="beast-detail">{{ t.发现地点 }}</div>
    </div>

    <div class="sec-hdr">📝 日志</div>
    <div v-if="Object.keys(logs).length === 0" class="empty-state">度过第一天后开始记录</div>
    <div v-for="(entry, date) in logs" :key="date" class="card">
      <div class="beast-head"><strong>{{ date }}</strong></div>
      <div class="beast-detail">{{ entry }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';

const store = useDataStore();
const d = computed(() => store.data);
const journal = computed(() => d.value.图鉴 ?? {});

const beasts = computed(() => journal.value.野兽 ?? {});
const herbs = computed(() => journal.value.草药 ?? {});
const tracks = computed(() => journal.value.足迹 ?? {});
const logs = computed(() => journal.value.日志 ?? {});

function dangerBadge(d: string) {
  if (d === '致命') return 'badge badge-bad';
  if (d === '危险') return 'badge badge-warn';
  if (d === '警惕') return 'badge badge-info';
  return 'badge badge-good';
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.empty-state { text-align: center; padding: 20px; font-size: 12px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 4px; margin-bottom: 8px; }
.beast-head { display: flex; justify-content: space-between; align-items: center; }
.beast-detail { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
</style>
