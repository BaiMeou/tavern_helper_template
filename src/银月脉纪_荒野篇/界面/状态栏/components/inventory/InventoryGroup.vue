<template>
  <div class="panel">
    <div class="weight-card">
      <div class="weight-top">
        <span class="weight-big">{{ 当前负重.toFixed(1) }}</span>
        <span class="weight-max">/ {{ 安全上限 }} kg</span>
        <InfoI term="负重" />
        <span :class="['badge', ratioBadge]">{{ ratioLabel }}</span>
        <span class="weight-pct">{{ 负重比 }}% · 移速 {{ 移速修正 >= 0 ? '+' : '' }}{{ 移速修正 }}%<InfoI term="移速修正" /></span>
      </div>
      <div class="progress-track"><div class="progress-fill" :style="{ width: Math.min(负重比,100) + '%', background: ratioGradient }"></div></div>
      <div v-if="负重比 > 100" class="weight-warning">⚠️ 超过安全负重上限！移动速度大幅下降，体力消耗加速。</div>

      <DetailFold title="分布分析（智力≥6解锁）">
        <DataRow v-for="pos in loadPositions" :key="pos.key" :label="`${pos.icon} ${pos.label}`" :value="`${pos.weight.toFixed(2)}/${pos.cap}kg`" :kind="pos.over?'bad':pos.overComfort?'warn':'good'" />
        <DataRow label="重心偏移" :value="`${重心}cm`" :kind="重心>5?'warn':'good'" term="重心偏移" />
        <DataRow label="单点超载" :value="单点超载?'有':'无'" :kind="单点超载?'bad':'good'" term="单点超载" />
        <DataRow label="货舱待打捞" :value="`${货舱重.toFixed(1)}kg（不计负重）`" />
        <DataRow label="体能效率" :value="`${效率}%`" :kind="效率>80?'good':效率>60?'warn':'bad'" />
        <Formula>安全上限 = 50×0.3×0.6×(1+(体质−1)×0.08) = {{ 安全上限 }}kg</Formula>
      </DetailFold>
    </div>

    <div class="card" style="font-size:12px">
      <b>🪓 手持：</b>{{ 手持 || '空手' }} &nbsp;&nbsp; <b>👘 穿着：</b>{{ 穿着 || '破损的巫女服' }}
    </div>

    <div class="sec-hdr">🎒 物品清单 <span class="sub">点位置可调整 · 同步给AI</span></div>
    <div v-if="count === 0" class="empty-state">物品栏为空<br>AI 会在探索、搜刮、制作时自动添加物品条目</div>
    <ItemCard
      v-for="(item, key) in items" :key="key"
      :item-key="String(key)" :editable="true"
      :icon="itemIcon(item)" :name="item.名称 || key" :desc="item.描述 || ''"
      :weight="item.重量 != null ? item.重量 + 'kg' : ''" :location="item.位置 || ''"
      :badges="itemBadges(item)" :chips="itemChips(item)"
    />

    <div v-if="Object.keys(containers).length > 0" class="sec-hdr">🫗 容器</div>
    <div v-for="(c, key) in containers" :key="key" class="card">
      <strong>{{ key }}</strong> — {{ c.当前装载 }}/{{ c.容量 }}L
      <span v-if="c.可加热" class="badge badge-good">可加热</span>
      {{ c.装载内容 }}
    </div>

    <div v-if="Object.keys(garments).length > 0" class="sec-hdr">👘 衣物 <span class="sub">分层保暖</span></div>
    <div v-for="(g, key) in garments" :key="key" class="card">
      <strong>{{ key }}</strong> — 保暖{{ g.保暖值 }} 防风{{ g.防风值 }} · 湿度{{ g.湿度 }}%<InfoI term="体感温度" />
      <span class="chip">{{ g.当前层次 }}</span>
      <span v-if="g.破损度 > 0" class="badge badge-warn">破损{{ g.破损度 }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import ItemCard from './ItemCard.vue';
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';
import Formula from '../shared/Formula.vue';
import InfoI from '../shared/InfoI.vue';

const store = useDataStore();
const d = computed<any>(() => store.data);

const equip = computed(() => d.value.装备 ?? {});
const items = computed(() => d.value.装备?.物品栏 ?? {});
const containers = computed(() => d.value.装备?.容器 ?? {});
const garments = computed(() => d.value.装备?.衣物 ?? {});
const 手持 = computed(() => d.value.装备?.手持 ?? '');
const 穿着 = computed(() => d.value.装备?.穿着 ?? '');

const count = computed(() => Object.keys(items.value).length);
const 当前负重 = computed(() => d.value.$当前负重 ?? _.get(d.value, '装备.负重.当前', 7.5));
const 安全上限 = computed(() => _.get(d.value, '装备.负重.安全上限', 9));
const 负重比 = computed(() => Math.round((当前负重.value / 安全上限.value) * 100));
const 移速修正 = computed(() => d.value.$移动速度总修正 ?? 0);

const ratioBadge = computed(() => 负重比.value > 120 ? 'badge-bad' : 负重比.value > 100 ? 'badge-warn' : 'badge-good');
const ratioLabel = computed(() => 负重比.value > 120 ? '超重' : 负重比.value > 100 ? '满载' : 负重比.value > 80 ? '偏重' : '安全');
const ratioGradient = computed(() => 负重比.value > 100 ? 'var(--danger)' : 负重比.value > 80 ? 'linear-gradient(90deg,var(--success),var(--warning))' : 'var(--success)');

const 货舱重 = computed(() => {
  const 待 = d.value.$待搜刮货舱 ?? [];
  return (Array.isArray(待) ? 待 : []).reduce((s: number, x: any) => s + (x.重量 || 0), 0);
});

// 各位置负载分布
const POS_CAPS: Record<string, { cap: number; comfort: number; icon: string }> = {
  '手持': { cap: 3, comfort: 1, icon: '✋' }, '背包': { cap: 12, comfort: 6, icon: '🎒' },
  '腰挂': { cap: 3, comfort: 1.5, icon: '🔗' }, '尾藏': { cap: 1, comfort: 0.3, icon: '🦊' },
  '颈间': { cap: 0.3, comfort: 0.1, icon: '💎' }, '穿着': { cap: 5, comfort: 2, icon: '👘' },
};
const loadPositions = computed(() => {
  const pos重: Record<string, number> = {};
  for (const item of Object.values(items.value) as any[]) {
    const p = item.位置; if (!POS_CAPS[p]) continue;
    pos重[p] = (pos重[p] || 0) + (item.重量 || 0) * (item.数量 || 1);
  }
  return Object.entries(POS_CAPS).map(([k, v]) => {
    const w = pos重[k] || 0;
    return { key: k, label: k, icon: v.icon, weight: w, cap: v.comfort, over: w > v.cap, overComfort: w > v.comfort && w <= v.cap };
  });
});
const 单点超载 = computed(() => loadPositions.value.some(p => p.over));
const 重心 = computed(() => {
  // 简化：背包 vs 单侧（腰挂+手持）的重心偏移估计
  const 背 = loadPositions.value.find(p => p.key === '背包')?.weight || 0;
  const 侧 = (loadPositions.value.find(p => p.key === '腰挂')?.weight || 0) + (loadPositions.value.find(p => p.key === '手持')?.weight || 0);
  return Math.round(Math.abs(背 * 0.1 - 侧 * 0.5) * 10) / 10;
});
const 效率 = computed(() => Math.max(20, Math.round(100 - 负重比.value * 0.4 - (单点超载.value ? 20 : 0))));

function itemIcon(item: any): string {
  const map: Record<string, string> = {
    '工具':'🔧','容器':'🫗','食物':'🍞','庇护':'⛺','武器':'⚔️',
    '医疗':'🩹','电子':'📱','特殊':'📦','材料':'🧱','自制':'🔨','烹饪':'🍳','弹药':'🎯',
  };
  return map[item.分类] || '📦';
}
function itemBadges(item: any) {
  const badges: any[] = [];
  if (item.耐久度 != null) badges.push({ text: `耐久 ${item.耐久度}%`, kind: item.耐久度 > 60 ? 'good' : item.耐久度 > 30 ? 'warn' : 'bad' });
  if (item.数量) badges.push({ text: `×${item.数量}`, kind: 'info' });
  return badges;
}
function itemChips(item: any) {
  const chips: string[] = [];
  if (item.保质期天 != null) chips.push(`保质${item.保质期天}天`);
  if (item.锋利度 != null) chips.push(`锋利${item.锋利度}%`);
  if (item.电量 != null) chips.push(`电量${item.电量}%`);
  if (item.损坏标签) chips.push(item.损坏标签);
  return chips;
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.weight-card { background: linear-gradient(135deg,#fffdf9,#f6efe4); border: 1px solid var(--border); border-left: 4px solid var(--accent); border-radius: 8px; padding: 13px; margin-bottom: 12px; box-shadow: var(--shadow-sm); }
.weight-top { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.weight-big { font-size: 28px; font-weight: 900; font-family: var(--font-display); }
.weight-max { color: var(--text-secondary); font-size: 13px; }
.weight-pct { font-size: 11px; color: var(--text-secondary); margin-left: auto; display: flex; align-items: center; gap: 3px; }
.weight-warning { font-size: 11px; color: var(--danger); margin-top: 6px; }
.sec-hdr .sub { font-size: 10px; font-weight: normal; color: var(--text-secondary); }
.empty-state { text-align: center; padding: 20px; font-size: 12px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 6px; margin-bottom: 8px; }
</style>
