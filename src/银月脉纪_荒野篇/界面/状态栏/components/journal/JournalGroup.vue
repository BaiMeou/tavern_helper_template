<template>
  <div class="panel">
    <div class="sec-hdr">🐾 野兽图鉴 <span class="sub">AI 自动补充</span></div>
    <div v-if="Object.keys(beasts).length === 0" class="empty-state">尚未遭遇任何生物<br>首次遭遇后 AI 自动创建图鉴条目</div>
    <div v-for="(b, key) in beasts" :key="key" class="card">
      <div class="beast-head">
        <strong>{{ b.名称 }}</strong>
        <span :class="['badge', dangerBadge(b.危险等级)]">{{ b.危险等级 }}</span>
      </div>
      <div class="beast-detail">{{ b.习性 }} · {{ b.活动时段 }} · 体型{{ b.体型 }}</div>
      <div class="beast-detail" v-if="b.足迹描述">足迹：{{ b.足迹描述 }}</div>
      <DetailFold title="遭遇与利用">
        <DataRow label="分类" :value="b.分类" />
        <DataRow label="是否可食用" :value="b.是否可食用 || '未知'" />
        <DataRow label="掉落物" :value="b.掉落物 || '未知'" />
        <DataRow label="首次发现" :value="`${b.首次发现地点} · ${b.首次发现时间 || ''}`" />
      </DetailFold>
    </div>

    <div class="sec-hdr">🌿 草药药典</div>
    <div v-if="Object.keys(herbs).length === 0" class="empty-state">尚未识别任何药用植物</div>
    <div v-for="(h, key) in herbs" :key="key" class="card">
      <strong>{{ h.名称 }}</strong>
      <div class="beast-detail">{{ h.药用功效 }} · 采集{{ h.采集部位 }} · {{ h.处理方式 }}</div>
      <div class="beast-detail" v-if="h.禁忌" style="color:var(--danger)">禁忌：{{ h.禁忌 }}</div>
    </div>

    <div class="sec-hdr">👣 足迹与痕迹</div>
    <div v-if="Object.keys(tracks).length === 0" class="empty-state">尚未发现明显踪迹</div>
    <div v-for="(t, key) in tracks" :key="key" class="card">
      <div class="beast-head"><strong>{{ t.推测生物 }}</strong> <span :class="['badge', freshBadge(t.新鲜度)]">{{ t.新鲜度 }}</span></div>
      <div class="beast-detail">方向：{{ t.方向 }} · {{ t.发现地点 }}</div>
      <div class="beast-detail" v-if="t.备注">{{ t.备注 }}</div>
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
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';

const store = useDataStore();
const d = computed<any>(() => store.data);
const journal = computed(() => d.value.图鉴 ?? {});
const beasts = computed(() => journal.value.野兽 ?? {});
const herbs = computed(() => journal.value.草药 ?? {});
const tracks = computed(() => journal.value.足迹 ?? {});
const logs = computed(() => journal.value.日志 ?? {});

function dangerBadge(s: string) {
  if (s === '致命') return 'badge-bad';
  if (s === '危险') return 'badge-warn';
  if (s === '警惕') return 'badge-info';
  return 'badge-good';
}
function freshBadge(s: string) {
  if (s === '极新' || s === '新') return 'badge-bad';
  if (s === '较新') return 'badge-warn';
  return 'badge-info';
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.sec-hdr .sub { font-size: 10px; font-weight: normal; color: var(--text-secondary); }
.empty-state { text-align: center; padding: 18px; font-size: 11px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 6px; margin-bottom: 8px; }
.beast-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
.beast-detail { font-size: 11px; color: var(--text-secondary); margin-top: 3px; line-height: 1.5; }
</style>
