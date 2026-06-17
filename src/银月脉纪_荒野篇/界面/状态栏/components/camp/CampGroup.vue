<template>
  <div class="panel" :class="{ locked: !isUnlocked }">
    <div v-if="!isUnlocked" class="empty-state">
      🔒 尚未解锁<br>搭建第一处庇护所后解锁营地管理面板
    </div>

    <template v-if="isUnlocked">
      <div class="sec-hdr">🏠 庇护所</div>
      <div class="card">
        <strong>类型：</strong>{{ shelter.类型 || '无' }}
        <span v-if="shelter.完整度"> · 完整度 {{ shelter.完整度 }}% · 舒适 {{ shelter.舒适度 }}/10</span>
      </div>

      <div class="sec-hdr">🔥 篝火</div>
      <div class="card">
        <span :class="fireBadge">{{ fire.状态 }}</span>
        <template v-if="fire.状态 !== '未点燃' && fire.状态 !== '熄灭'">
          · {{ fire.燃料类型 }} · 剩余 {{ fire.燃料余量 }}min · 辐射半径 {{ fire.热辐射半径 }}m
        </template>
      </div>

      <div class="sec-hdr">💧 储水</div>
      <div v-for="(w, key) in water" :key="key" class="card">
        <strong>{{ key }}</strong> — {{ w.水质 }} · {{ w.容量 }}L · {{ w.收集日期 }}
      </div>
      <div v-if="Object.keys(water).length === 0" class="empty-state">尚无储水</div>

      <div class="sec-hdr">🥫 食物库存</div>
      <div v-for="(f, key) in food" :key="key" class="card">
        <strong>{{ key }}</strong> — ×{{ f.数量 }}{{ f.单位 }} · 剩余 {{ f.保质期剩余天 }}天
        <span :class="spoilageBadge(f.腐败风险)">{{ f.腐败风险 }}</span>
      </div>
      <div v-if="Object.keys(food).length === 0" class="empty-state">尚无库存</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';

const store = useDataStore();
const d = computed(() => store.data);
const camp = computed(() => d.value.营地 ?? {});
const shelter = computed(() => camp.value.庇护所 ?? {});
const fire = computed(() => camp.value.篝火 ?? {});
const water = computed(() => camp.value.储水 ?? {});
const food = computed(() => camp.value.食物库存 ?? {});

const isUnlocked = computed(() => shelter.value.类型 !== '无');

function fireBadge() {
  const s = fire.value.状态;
  if (s === '旺盛') return 'badge badge-good';
  if (s === '点燃' || s === '点燃中') return 'badge badge-warn';
  return 'badge badge-bad';
}
function spoilageBadge(r: string) {
  if (r === '安全') return 'badge badge-good';
  if (r === '需尽快食用') return 'badge badge-warn';
  return 'badge badge-bad';
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; position: relative; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.locked { opacity: 0.45; filter: grayscale(0.4); }
.empty-state { text-align: center; padding: 20px; font-size: 12px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 4px; margin-bottom: 8px; }
</style>
