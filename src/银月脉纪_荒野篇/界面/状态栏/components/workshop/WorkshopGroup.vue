<template>
  <div class="panel">
    <div class="card card-accent" style="font-size:12px">
      <span style="font-size:20px;">🧠</span> <strong>智力 LV.{{ intellect }}</strong>
      <template v-if="thinkAccel"> — 思维加速可用<InfoI term="思维加速" /></template>
      <div class="subtle">晓光能在脑海中推演物品制作方法。发现材料或尝试制作时自动解锁配方。</div>
    </div>

    <div class="sec-hdr">✈️ 搜刮残骸 <span class="sub">感知影响发现概率</span></div>
    <div class="card">
      <p style="font-size:11px;color:var(--text-secondary);margin-bottom:9px">飞机货舱中的物品——坠机冲击下有些可能还没损坏。点击发起搜刮（AI会判定发现什么）。</p>
      <button class="roll-btn" @click="scavenge">🎲 搜索货舱残骸</button>
      <DetailFold title="搜刮判定">
        <DataRow label="基础掷骰" value="1d100" />
        <DataRow label="感知加成" :value="`+${(感知-1)*3}`" kind="good" />
        <DataRow label="易损度减项" value="−物品易损度" kind="warn" />
        <div class="data-row"><span style="font-size:11px;color:var(--text-secondary)">≥80 完好 / ≥55 少耐久 / ≥30 部分损坏 / &lt;30 损坏</span></div>
        <Formula>最终 = 1d100 + (感知−1)×3 − 物品易损度</Formula>
      </DetailFold>
    </div>

    <div class="sec-hdr">🛠️ 配方 <span class="sub">{{ recipeCount }} 个已解锁 · 点可合成</span></div>
    <div v-if="recipeCount === 0" class="empty-state">尚未解锁任何配方<br>发现材料或尝试制作时 AI 自动解锁</div>
    <div v-for="(r, key) in recipes" :key="key" class="recipe-card">
      <div class="rc-head">
        <span class="rc-name">{{ key }}</span>
        <span class="rc-tool">🛠️ {{ r.所需工具 || '徒手' }}</span>
      </div>
      <div class="rc-effect">{{ r.效果描述 }}</div>
      <div class="rc-mats">
        <span v-for="(amt, mat) in r.所需材料" :key="mat" class="mat-tag">{{ mat }} ({{ amt }})</span>
      </div>
      <div class="op-line">
        <span style="font-size:10px;color:var(--text-secondary)">耗时{{ r.制作耗时分钟 }}min · 需智力{{ r.所需智力 || 0 }}</span>
        <button class="op-btn" @click="craft(key)" :disabled="!r.已解锁">{{ r.已解锁 ? '🔨 合成' : '🔒 未解锁' }}</button>
      </div>
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
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';
import Formula from '../shared/Formula.vue';
import InfoI from '../shared/InfoI.vue';

const store = useDataStore();
const d = computed<Schema>(() => store.data);

const intellect = computed(() => d.value.晓光?.基础属性?.智力 ?? 8);
const thinkAccel = computed(() => d.value.晓光?.$思维加速可用 ?? false);
const 感知 = computed(() => d.value.晓光?.基础属性?.感知 ?? 4);
const recipes = computed(() => d.value.工坊?.配方 ?? {});
const recipeCount = computed(() => Object.keys(recipes.value).filter(k => recipes.value[k].已解锁).length);
const traps = computed(() => d.value.工坊?.陷阱 ?? {});

function trapBadge(s: string) {
  if (s === '捕获成功') return 'badge-good';
  if (s === '待机') return 'badge-info';
  if (s === '已损坏') return 'badge-bad';
  return 'badge-warn';
}

function nowLabel() {
  const t = d.value.世界?.时间;
  return `第${t?.天数 ?? 0}天 ${t?.时段 ?? ''}`;
}
function pushOp(text: string) {
  const ops = _.get(store.data, '$近期操作', []) as any[];
  ops.push({ t: nowLabel(), text });
  while (ops.length > 5) ops.shift();
  _.set(store.data, '$近期操作', ops);
}

function scavenge() {
  // 表达意图 + 静默触发引擎掷骰。结果由脚本回写 $上次掷骰，下一轮 AI 读到后叙事。
  pushOp('晓光开始搜刮货舱残骸');
  _.set(store.data, '$掷骰请求', { 类型: '搜刮', 时间: nowLabel() });
}
function craft(name: string) {
  // 表达意图 + 静默触发引擎校验扣减。结果由脚本回写 $上次合成，下一轮 AI 读到后叙事。
  pushOp(`晓光尝试合成「${name}」`);
  _.set(store.data, '$合成请求', { 配方名: name, 时间: nowLabel() });
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.subtle { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
.sec-hdr .sub { font-size: 10px; font-weight: normal; color: var(--text-secondary); }
.empty-state { text-align: center; padding: 18px; font-size: 11px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 6px; margin-bottom: 8px; }
.recipe-card { background: var(--card); border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-bottom: 8px; box-shadow: var(--shadow-sm); }
.rc-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.rc-name { font-size: 14px; font-weight: bold; color: var(--accent); font-family: var(--font-display); }
.rc-tool { font-size: 10px; background: var(--nav); padding: 3px 8px; border-radius: 3px; color: var(--text-secondary); white-space: nowrap; }
.rc-effect { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4; }
.rc-mats { font-size: 11px; border-top: 1px dashed rgba(0,0,0,.06); padding-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
.mat-tag { font-size: 10px; padding: 2px 8px; border-radius: 3px; background: rgba(168,68,52,.06); color: var(--accent); }
.op-line { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.op-btn { font-size: 11px; padding: 5px 11px; border-radius: 5px; border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; font-family: var(--font-body); }
.op-btn:disabled { background: var(--nav); color: var(--text-secondary); border-color: var(--border); cursor: not-allowed; }
.roll-btn { width: 100%; padding: 11px; border-radius: 7px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: bold; cursor: pointer; }
.roll-btn:hover { background: var(--accent-light); }
.data-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed rgba(140,126,108,.22); font-size: 12px; }
</style>
