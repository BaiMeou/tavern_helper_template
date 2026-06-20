<template>
  <div class="panel" :class="{ locked: !isUnlocked }">
    <div v-if="!isUnlocked" class="empty-state">
      🔒 尚未解锁<br>搭建第一处庇护所后解锁营地管理面板
    </div>

    <template v-else>
      <div class="sec-hdr">🏠 庇护所</div>
      <div class="card">
        <strong>类型：</strong>{{ shelter.类型 }}
        <span v-if="shelter.完整度"> · 完整度 {{ shelter.完整度 }}% · 舒适 {{ shelter.舒适度 }}/10</span>
        <div class="op-line" v-if="shelter.内部温差">
          <span style="font-size:11px;color:var(--success)">内部比外面暖 {{ shelter.内部温差 }}°C</span>
        </div>
      </div>

      <div class="sec-hdr">🔥 篝火 <span class="sub">可操作</span></div>
      <div class="card">
        <div class="op-line">
          <span><span :class="['badge', fireBadge]">{{ fire.状态 }}</span></span>
          <span v-if="fire.状态 !== '未点燃' && fire.状态 !== '熄灭'" style="font-size:11px;color:var(--text-secondary)">
            {{ fire.燃料类型 }} · 剩余 {{ fire.燃料余量 }}min · 取暖 {{ fire.热辐射半径 }}m
          </span>
          <button v-if="fire.状态 === '未点燃' || fire.状态 === '熄灭'" class="op-btn" @click="op('生火', '尝试生火')">🔥 生火</button>
          <button v-else class="op-btn ghost" @click="op('添柴', '向篝火添柴')">🪵 添柴</button>
        </div>
        <DetailFold title="篝火参数">
          <DataRow label="火心温度" :value="`${fire.中心温度}°C`" />
          <DataRow label="取暖范围" :value="`${fire.热辐射半径}m`" term="热辐射半径" />
          <DataRow label="还能烧多久" :value="`${fire.燃料余量}min`" :kind="fire.燃料余量<30?'warn':'good'" term="燃料余量" />
          <DataRow label="每分钟耗料" :value="`${fire.消耗率}g`" />
          <Formula>点燃所需：火源 + 引火物 + 干燥燃料 · 雨天难度 +30%</Formula>
        </DetailFold>
      </div>

      <div class="sec-hdr">💧 储水 <span class="sub">可操作</span></div>
      <div v-if="Object.keys(water).length === 0" class="empty-state">尚无储水</div>
      <div v-for="(wt, key) in water" :key="key" class="card">
        <div class="op-line">
          <span style="font-size:12px"><b>{{ key }}</b> — {{ wt.容量 }}L · <span :class="['badge', 水质Badge(wt.水质)]">{{ wt.水质 }}</span></span>
          <span>
            <button v-if="wt.水质 === '生水'" class="op-btn ghost" @click="op('煮沸', `煮沸${wt.容量}L水`)">煮沸</button>
            <button v-if="wt.水质 === '可饮用'" class="op-btn ghost" @click="op('饮用', `饮用${wt.容量}L水`)">饮用</button>
          </span>
        </div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">来源：{{ wt.来源 || wt.收集日期 }}</div>
      </div>

      <div class="sec-hdr">🥫 食物库存 <span class="sub">可操作</span></div>
      <div v-if="Object.keys(food).length === 0" class="empty-state">尚无库存</div>
      <div v-for="(fd, key) in food" :key="key" class="card">
        <div class="op-line">
          <span style="font-size:12px"><b>{{ key }}</b> — ×{{ fd.数量 }}{{ fd.单位 }} · 剩余 {{ fd.保质期剩余天 }}天 <span :class="['badge', 腐败Badge(fd.腐败风险)]">{{ fd.腐败风险 }}</span></span>
          <button class="op-btn ghost" @click="op('食用', `食用${key}`)">食用</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';
import Formula from '../shared/Formula.vue';

const store = useDataStore();
const d = computed(() => store.data);
const shelter = computed(() => d.value.营地?.庇护所 ?? {});
const fire = computed(() => d.value.营地?.篝火 ?? {});
const water = computed(() => d.value.营地?.储水 ?? {});
const food = computed(() => d.value.营地?.食物库存 ?? {});

const isUnlocked = computed(() => shelter.value.类型 && shelter.value.类型 !== '无');

const fireBadge = computed(() => {
  const s = fire.value.状态;
  if (s === '旺盛') return 'badge-good';
  if (s === '点燃' || s === '引火中') return 'badge-warn';
  if (s === '衰减' || s === '余烬') return 'badge-warn';
  return 'badge-bad';
});
function 水质Badge(q: string) {
  if (q === '可饮用') return 'badge-good';
  if (q === '煮沸中' || q === '沉淀中') return 'badge-warn';
  return 'badge-bad';
}
function 腐败Badge(r: string) {
  if (r === '安全') return 'badge-good';
  if (r === '需尽快食用') return 'badge-warn';
  return 'badge-bad';
}

function op(action: string, desc: string) {
  // 玩家操作 = 表达意图 + 静默触发引擎结算。结果由脚本回写后，下一轮 AI 自然读到。
  // 前端只负责：写$前端操作(意图) + 静默写触发字段($掷骰请求等)。不替AI叙事、不显示后端字眼。
  const 天数 = d.value.世界?.时间?.天数 ?? 0;
  const 时段 = d.value.世界?.时间?.时段 ?? '';
  const ts = `第${天数}天 ${时段}`;
  const ops = _.get(store.data, '$近期操作', []) as any[];
  ops.push({ t: ts, text: desc });
  while (ops.length > 5) ops.shift();
  _.set(store.data, '$近期操作', ops);
  _.set(store.data, '$前端操作', desc);
  if (action === '生火') {
    _.set(store.data, '$掷骰请求', { 类型: '生火', 雨天: (d.value.世界?.时间?.天气 ?? '').includes('雨'), 引火物: true, 时间: ts });
  }
  // 其余操作（添柴/煮沸/饮用/食用）只表达意图，由 AI 下一轮叙事推进，前端不直接改状态
  toastr.info('已记录，等待晓光行动…');
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; position: relative; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.locked { opacity: 0.45; filter: grayscale(0.4); }
.sec-hdr .sub { font-size: 10px; font-weight: normal; color: var(--text-secondary); }
.empty-state { text-align: center; padding: 18px; font-size: 11px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 6px; margin-bottom: 8px; }
.op-line { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.op-btn { font-size: 11px; padding: 5px 11px; border-radius: 5px; border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; font-family: var(--font-body); }
.op-btn.ghost { background: var(--card); color: var(--accent); }
.op-btn:hover { opacity: 0.88; }
</style>
