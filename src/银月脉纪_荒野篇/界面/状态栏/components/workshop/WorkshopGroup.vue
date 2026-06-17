<template>
  <div class="panel">
    <div class="card card-accent">
      <span style="font-size:20px;">🧠</span>
      <strong>智力 LV.{{ intellect }}</strong>
      <template v-if="thinkAccel"> — 思维加速可用</template>
      <div class="subtle">晓光能在脑海中推演物品制作方法。发现材料或尝试制作时自动解锁配方。</div>
    </div>

    <div class="sec-hdr">🛠️ 配方 <span class="subtle">{{ recipeCount }} 个已解锁</span></div>
    <div v-if="recipeCount === 0" class="empty-state">
      尚未解锁任何配方<br>发现材料或尝试制作时 AI 自动解锁
    </div>
    <div v-for="(r, key) in recipes" :key="key" class="recipe-card">
      <div class="rc-head">
        <span class="rc-name">{{ key }}</span>
        <span class="rc-tool">🛠️ {{ r.所需工具 }}</span>
      </div>
      <div class="rc-effect">{{ r.效果描述 }}</div>
      <div class="rc-mats">
        <span v-for="(amt, mat) in r.所需材料" :key="mat" class="mat-tag">
          {{ mat }} ({{ amt }})
        </span>
      </div>
    </div>

    <div class="sec-hdr">🕸️ 陷阱网络</div>
    <div v-if="Object.keys(traps).length === 0" class="empty-state">尚未布置任何陷阱</div>
    <div v-for="(t, key) in traps" :key="key" class="card">
      <strong>{{ key }}</strong> — {{ t.类型 }} · {{ t.位置 }}
      <span :class="trapBadge(t.状态)">{{ t.状态 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';

const store = useDataStore();
const d = computed(() => store.data);

const intellect = computed(() => d.value.晓光?.基础属性?.智力 ?? 8);
const thinkAccel = computed(() => d.value.晓光?.$思维加速可用 ?? true);
const recipes = computed(() => d.value.工坊?.配方 ?? {});
const recipeCount = computed(() => Object.keys(recipes.value).filter(k => recipes.value[k].已解锁).length);
const traps = computed(() => d.value.工坊?.陷阱 ?? {});

function trapBadge(s: string) {
  if (s === '捕获成功') return 'badge badge-good';
  if (s === '待机') return 'badge badge-info';
  if (s === '已损坏') return 'badge badge-bad';
  return 'badge badge-warn';
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.subtle { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
.empty-state { text-align: center; padding: 20px; font-size: 12px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 4px; margin-bottom: 8px; }
.recipe-card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 12px; margin-bottom: 8px; box-shadow: var(--shadow-sm); }
.rc-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.rc-name { font-size: 14px; font-weight: bold; color: var(--accent); font-family: var(--font-display); }
.rc-tool { font-size: 10px; background: var(--nav); padding: 3px 8px; border-radius: 3px; color: var(--text-secondary); white-space: nowrap; }
.rc-effect { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4; }
.rc-mats { font-size: 11px; border-top: 1px dashed rgba(0,0,0,.06); padding-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
.mat-tag { font-size: 10px; padding: 2px 8px; border-radius: 3px; background: rgba(168,68,52,0.06); color: var(--accent); }
</style>
