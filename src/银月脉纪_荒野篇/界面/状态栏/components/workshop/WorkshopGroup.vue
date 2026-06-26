<template>
  <div class="panel">
    <div class="card card-accent" style="font-size:12px">
      <span style="font-size:20px;">🧠</span> <strong>智力 LV.{{ intellect }}</strong>
      <template v-if="thinkAccel"> — 思维加速可用<InfoI term="思维加速" /></template>
      <div class="subtle">晓光能在脑海中推演物品制作方法。发现材料或尝试制作时自动解锁配方。</div>
    </div>

    <!-- 配方：纯知识展示，无合成按钮。制作由 AI 在叙事里推进（扣材料/加产物）。
         详见《制作系统》：配方只是"晓光会做什么"的图鉴，不再走脚本合成引擎。 -->
    <div class="sec-hdr">📜 已掌握配方 <span class="sub">{{ recipeCount }} 个 · 知识卡</span></div>
    <div v-if="recipeCount === 0" class="empty-state">尚未掌握任何配方<br>在荒野中发现材料或尝试制作后会逐渐摸索出新方法</div>
    <div v-for="(r, key) in recipes" :key="key" class="recipe-card" :class="{ locked: !r.已解锁 }">
      <div class="rc-head">
        <span class="rc-name">{{ key }}</span>
        <span class="rc-tool">🛠️ {{ r.所需工具 || '徒手' }}</span>
      </div>
      <div class="rc-effect">{{ r.效果描述 }}</div>
      <div class="rc-mats">
        <span v-for="(amt, mat) in r.所需材料" :key="mat" class="mat-tag">{{ mat }} ({{ amt }})</span>
      </div>
      <div class="rc-foot">
        <span style="font-size:10px;color:var(--text-secondary)">耗时{{ r.制作耗时分钟 }}min · 需智力{{ r.所需智力 || 0 }}</span>
        <span :class="['badge', r.已解锁 ? 'badge-good' : 'badge-bad']">{{ r.已解锁 ? '已解锁' : '未解锁' }}</span>
      </div>
    </div>
    <div class="hint-card">
      💡 想让晓光制作某样东西？直接在对话里说"用XX材料做YY"——晓光会按配方动手，材料消耗与产物由剧情自然推进。
    </div>

    <!-- 搜刮：改为 AI 驱动的地点探索，不再是固定按钮掷骰。
         到遗迹/物资点等"有很多物品的地方"时，AI 会用 $前端选择 弹窗让玩家挑捡。 -->
    <div class="sec-hdr">🧭 地点探索</div>
    <div class="card" style="font-size:12px;line-height:1.7;color:var(--text-secondary)">
      到了<b>遗迹、物资点、坠机残骸</b>等物品密集的地点，晓光会自动留意可拾取的东西，并弹窗让你挑捡带哪些。普通路过不会触发搜刮——只在"值得翻找"的地方才展开。
    </div>

    <div class="sec-hdr">🕸️ 陷阱网络</div>
    <div v-if="Object.keys(traps).length === 0" class="empty-state">尚未布置任何陷阱</div>
    <div v-for="(t, key) in traps" :key="key" class="card">
      <strong>{{ key }}</strong> — {{ t.类型 }} · {{ t.位置 }}
      <span :class="['badge', trapBadge(t.状态)]">{{ t.状态 }}</span>
      <div v-if="t.布置天数 != null" style="font-size:10px;color:var(--text-secondary);margin-top:2px">已布置 {{ t.布置天数 }} 天 · {{ t.捕获物 || '未捕获' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Schema } from '../../../../schema';
import { useDataStore } from '../../store';
import InfoI from '../shared/InfoI.vue';

const store = useDataStore();
const d = computed<Schema>(() => store.data);

const intellect = computed(() => d.value.晓光?.基础属性?.智力 ?? 8);
const thinkAccel = computed(() => d.value.晓光?.$思维加速可用 ?? false);
const recipes = computed(() => d.value.工坊?.配方 ?? {});
const recipeCount = computed(() => Object.keys(recipes.value).filter(k => recipes.value[k].已解锁).length);
const traps = computed(() => d.value.工坊?.陷阱 ?? {});

function trapBadge(s: string) {
  if (s === '捕获成功') return 'badge-good';
  if (s === '待机') return 'badge-info';
  if (s === '已损坏') return 'badge-bad';
  return 'badge-warn';
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.subtle { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
.sec-hdr .sub { font-size: 10px; font-weight: normal; color: var(--text-secondary); }
.empty-state { text-align: center; padding: 18px; font-size: 11px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 6px; margin-bottom: 8px; }
.recipe-card { background: var(--card); border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-bottom: 8px; box-shadow: var(--shadow-sm); }
.recipe-card.locked { opacity: 0.55; }
.rc-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.rc-name { font-size: 14px; font-weight: bold; color: var(--accent); font-family: var(--font-display); }
.rc-tool { font-size: 10px; background: var(--nav); padding: 3px 8px; border-radius: 3px; color: var(--text-secondary); white-space: nowrap; }
.rc-effect { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4; }
.rc-mats { font-size: 11px; border-top: 1px dashed rgba(0,0,0,.06); padding-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
.mat-tag { font-size: 10px; padding: 2px 8px; border-radius: 3px; background: rgba(168,68,52,.06); color: var(--accent); }
.rc-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.hint-card {
  font-size: 11px; line-height: 1.6; color: var(--text-secondary);
  background: rgba(52,138,167,.06); border: 1px dashed rgba(52,138,167,.25);
  border-radius: 6px; padding: 9px 11px; margin-bottom: 12px;
}
.badge { font-size: 10px; padding: 2px 8px; border-radius: 3px; }
.badge-good { background: rgba(76,175,80,.15); color: var(--success); }
.badge-bad { background: rgba(224,73,60,.13); color: var(--danger); }
.badge-info { background: rgba(52,138,167,.12); color: var(--info); }
.badge-warn { background: rgba(226,143,27,.12); color: #b06f12; }
</style>
