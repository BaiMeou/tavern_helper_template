<template>
  <div class="panel">
    <!-- 环形负重面板 -->
    <div class="weight-panel">
      <div class="weight-top">
        <div class="weight-ring">
          <svg class="weight-ring-svg" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(140,126,108,.12)" stroke-width="6" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              :stroke="ratioGradient"
              stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="ringCirc"
              :stroke-dashoffset="ringOffset"
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div class="weight-ring-center">
            <div class="weight-ring-val">{{ Math.min(负重比, 100) }}%</div>
            <div class="weight-ring-lbl">负载</div>
          </div>
        </div>
        <div class="weight-info">
          <div class="weight-big">
            {{ (当前负重 ?? 0).toFixed(1) }} <span class="weight-max">/ {{ 安全上限 }} kg</span>
          </div>
          <div class="weight-pct">
            {{ ratioLabel }} · 移速 {{ 移速修正 >= 0 ? '+' : '' }}{{ 移速修正 }}%<InfoI term="移速修正" />
          </div>
          <div class="weight-bar">
            <i :style="{ width: Math.min(负重比, 100) + '%', background: ratioGradient }"></i>
          </div>
        </div>
      </div>
      <!-- 位置分布条 -->
      <div class="load-dist">
        <div v-for="pos in loadPositions" :key="pos.key" class="ld-row">
          <span class="ld-pos">{{ pos.icon }} {{ pos.label }}</span>
          <span class="ld-track">
            <i
              :style="{
                width: pos.cap > 0 ? Math.min(100, (pos.weight / pos.cap) * 100) + '%' : '0%',
                background: pos.over ? 'var(--danger)' : pos.overComfort ? 'var(--warning)' : 'var(--info)',
              }"
            ></i>
          </span>
          <span class="ld-val">{{ pos.weight.toFixed(1) }}/{{ pos.cap }}kg</span>
        </div>
      </div>
      <div v-if="负重比 > 100" class="weight-warning">⚠️ 超过安全负重上限！移动速度大幅下降，体力消耗加速。</div>

      <DetailFold title="分布分析（智力≥6解锁）">
        <DataRow
          v-for="pos in loadPositions"
          :key="pos.key"
          :label="`${pos.icon} ${pos.label}`"
          :value="`${pos.weight.toFixed(2)}/${pos.cap}kg`"
          :kind="pos.over ? 'bad' : pos.overComfort ? 'warn' : 'good'"
        />
        <DataRow label="重心偏移" :value="`${重心}cm`" :kind="重心 > 5 ? 'warn' : 'good'" term="重心偏移" />
        <DataRow label="单点超载" :value="单点超载 ? '有' : '无'" :kind="单点超载 ? 'bad' : 'good'" term="单点超载" />
        <DataRow label="货舱待打捞" :value="`${货舱重.toFixed(1)}kg（不计负重）`" />
        <DataRow label="体能效率" :value="`${效率}%`" :kind="效率 > 80 ? 'good' : 效率 > 60 ? 'warn' : 'bad'" />
        <Formula>安全上限 = 50×0.3×0.6×(1+(体质−1)×0.08) = {{ 安全上限 }}kg</Formula>
      </DetailFold>
    </div>

    <!-- 手持 / 穿着 摘要 -->
    <div class="card summary-card">
      <span><b>🪓 手持：</b>{{ 手持 || '空手' }}</span>
      <span><b>👘 穿着：</b>{{ 穿着 || '无' }}</span>
    </div>

    <!-- 筛选 / 排序栏 -->
    <div class="sec-hdr">📦 物品栏 <span class="sub">可拖拽换位 · 点击详情</span></div>
    <div class="filter-bar">
      <button
        v-for="cat in filterCats"
        :key="cat"
        :class="['filter-chip', { active: filterCat === cat }]"
        @click="filterCat = cat"
      >
        {{ cat || '全部' }}
      </button>
      <select v-model="sortBy" class="sort-select">
        <option value="default">默认</option>
        <option value="weight">按重量</option>
        <option value="durability">按耐久</option>
        <option value="category">按分类</option>
      </select>
    </div>

    <div v-if="count === 0" class="empty-state">物品栏为空<br />探索、搜刮、制作时会自动收入新物品</div>
    <div class="item-grid">
      <div
        v-for="(item, key) in sortedItems"
        :key="key"
        class="item-card"
        :class="{ dragging: dragKey === key, 'drag-over': dragOverKey === key }"
        draggable="true"
        @click="openDetail(String(key), item)"
        @dragstart="onDragStart($event, String(key))"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver(String(key))"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop(String(key))"
      >
        <div class="ic-head">
          <div class="ic-icon">{{ itemIcon(item) }}</div>
          <div>
            <div class="ic-name">{{ item.名称 || key }}</div>
            <div class="ic-cat">
              {{ item.分类 }}<template v-if="item.耐久度 != null"> · 耐久 {{ item.耐久度 }}%</template
              ><template v-if="item.数量"> · ×{{ item.数量 }}</template>
            </div>
          </div>
        </div>
        <div class="ic-meta">
          <span v-for="chip in itemChips(item)" :key="chip" class="chip">{{ chip }}</span>
        </div>
        <div v-if="item.保质期天 != null" :class="['freshness-bar', freshnessClass(item.保质期天)]">
          <i :style="{ width: freshnessWidth(item.保质期天) + '%' }"></i>
        </div>
        <div class="ic-foot">
          <span class="ic-wt">{{ (item.重量 ?? 0).toFixed(1) }}kg</span>
          <span :class="['ic-loc', item.位置]">{{ item.位置 || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- 容器 -->
    <div v-if="Object.keys(containers).length > 0" class="sec-hdr">🫗 容器</div>
    <div v-for="(c, key) in containers" :key="key" class="card">
      <strong>{{ key }}</strong> — {{ c.当前装载 }}/{{ c.容量 }}L
      <span v-if="c.可加热" class="badge badge-good">可加热</span>
      {{ c.装载内容 }}
    </div>

    <!-- 衣物网格 -->
    <div v-if="Object.keys(garments).length > 0" class="sec-hdr">👘 衣物 <span class="sub">分层保暖</span></div>
    <div class="item-grid">
      <div v-for="(g, key) in garments" :key="key" class="item-card" @click="openDetail(String(key), g)">
        <div class="ic-head">
          <div class="ic-icon">👘</div>
          <div>
            <div class="ic-name">{{ key }}</div>
            <div class="ic-cat">{{ g.部位 }} · 保暖{{ g.保暖值 }} 防风{{ g.防风值 }}</div>
          </div>
        </div>
        <div class="ic-meta">
          <span class="chip">{{ g.当前层次 }}</span>
          <span class="chip">湿度{{ g.湿度 }}%</span>
          <span v-if="g.破损度 > 0" class="badge badge-warn">破损{{ g.破损度 }}%</span>
          <span v-else class="badge badge-good">完好</span>
        </div>
        <div class="ic-foot">
          <InfoI term="体感温度" />
          <span class="ic-loc 穿着">穿着</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="op-line">
      <button class="op-btn ghost" @click="campAction('整理物品栏')">📦 整理</button>
      <button class="op-btn ghost" @click="campAction('丢弃腐败食物')">🗑️ 丢弃腐败</button>
    </div>

    <!-- 物品详情弹窗 -->
    <Teleport to="body">
      <div v-if="detailItem" class="item-detail-overlay open" @click.self="closeDetail">
        <div class="item-detail-card">
          <div class="idc-head">
            <div class="idc-icon">{{ detailItem.icon }}</div>
            <div>
              <div class="idc-name">{{ detailItem.name }}</div>
              <div class="idc-cat">{{ detailItem.cat }}</div>
            </div>
          </div>
          <div class="idc-body">
            <div v-for="row in detailItem.rows" :key="row.label" class="idc-row">
              <span>{{ row.label }}</span>
              <span :class="['dr-val', row.kind]">{{ row.value }}</span>
            </div>
          </div>
          <div class="idc-actions">
            <button class="op-btn" @click="useItem('使用')">✋ 使用</button>
            <button class="op-btn ghost" @click="useItem('修理')">🔧 修理</button>
            <button
              class="op-btn ghost"
              style="border-color: rgba(224, 73, 60, 0.3); color: var(--danger)"
              @click="useItem('丢弃')"
            >
              🗑️ 丢弃
            </button>
            <button class="op-btn ghost" style="flex: 0; padding: 8px 14px" @click="closeDetail">✕</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '../../store';
import { POS_CAPS, POS_ICONS } from '../../../../schema';
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';
import Formula from '../shared/Formula.vue';
import InfoI from '../shared/InfoI.vue';

const store = useDataStore();
const d = computed<any>(() => store.data);

const items = computed(() => d.value.装备?.物品栏 ?? {});
const containers = computed(() => d.value.装备?.容器 ?? {});
const garments = computed(() => d.value.装备?.衣物 ?? {});
const 手持 = computed(() => d.value.装备?.手持 ?? '');
const 穿着 = computed(() => d.value.装备?.穿着 ?? '');

const count = computed(() => Object.keys(items.value).length);
const 当前负重 = computed(() => d.value.$当前负重 ?? 0);
const 安全上限 = computed(() => _.get(d.value, '装备.负重.安全上限', 9));
const 负重比 = computed(() => d.value.$负重比 ?? Math.round((当前负重.value / Math.max(安全上限.value, 0.1)) * 100));
const 移速修正 = computed(() => d.value.$移动速度总修正 ?? 0);

const ratioBadge = computed(() =>
  负重比.value > 120 ? 'badge-bad' : 负重比.value > 100 ? 'badge-warn' : 'badge-good',
);
const ratioLabel = computed(() =>
  负重比.value > 120 ? '超重' : 负重比.value > 100 ? '满载' : 负重比.value > 80 ? '偏重' : '安全',
);
const ratioGradient = computed(() =>
  负重比.value > 100
    ? 'var(--danger)'
    : 负重比.value > 80
      ? 'linear-gradient(90deg,var(--success),var(--warning))'
      : 'var(--success)',
);

// 环形进度计算
const ringCirc = 2 * Math.PI * 34; // ≈ 213.6
const ringOffset = computed(() => ringCirc - (Math.min(负重比.value, 100) / 100) * ringCirc);

const 货舱重 = computed(() => {
  const 待 = d.value.$待搜刮货舱 ?? [];
  return (Array.isArray(待) ? 待 : []).reduce((s: number, x: any) => s + (x.重量 || 0), 0);
});

// 各位置负载分布（POS_CAPS/POS_ICONS 单一数据源来自 schema.ts，不再本地重复定义）
const POS_CAPS_LOCAL = Object.fromEntries(
  Object.entries(POS_CAPS).map(([k, v]) => [k, { comfort: v.舒适, cap: v.绝对, icon: POS_ICONS[k] ?? '📦' }]),
);
const loadPositions = computed(() => {
  const pos重: Record<string, number> = {};
  for (const item of Object.values(items.value) as any[]) {
    const p = item.位置;
    if (!POS_CAPS_LOCAL[p]) continue;
    pos重[p] = (pos重[p] || 0) + (item.重量 || 0) * (item.数量 || 1);
  }
  return Object.entries(POS_CAPS_LOCAL).map(([k, v]) => {
    const w = pos重[k] || 0;
    return {
      key: k,
      label: k,
      icon: v.icon,
      weight: w,
      cap: v.cap,
      over: w > v.cap,
      overComfort: w > v.comfort && w <= v.cap,
    };
  });
});
const 单点超载 = computed(() => loadPositions.value.some(p => p.over));
const 重心 = computed(() => {
  // 简化：背包 vs 单侧（腰挂+手持）的重心偏移估计
  const 背 = loadPositions.value.find(p => p.key === '背包')?.weight || 0;
  const 侧 =
    (loadPositions.value.find(p => p.key === '腰挂')?.weight || 0) +
    (loadPositions.value.find(p => p.key === '手持')?.weight || 0);
  return Math.round(Math.abs(背 * 0.1 - 侧 * 0.5) * 10) / 10;
});
const 效率 = computed(() => Math.max(20, Math.round(100 - 负重比.value * 0.4 - (单点超载.value ? 20 : 0))));

function itemIcon(item: any): string {
  const map: Record<string, string> = {
    工具: '🔧',
    容器: '🫗',
    食物: '🍞',
    庇护: '⛺',
    武器: '⚔️',
    医疗: '🩹',
    电子: '📱',
    特殊: '📦',
    材料: '🧱',
    自制: '🔨',
    烹饪: '🍳',
    弹药: '🎯',
  };
  return map[item.分类] || '📦';
}
function itemBadges(item: any) {
  const badges: any[] = [];
  if (item.耐久度 != null)
    badges.push({ text: `耐久 ${item.耐久度}%`, kind: item.耐久度 > 60 ? 'good' : item.耐久度 > 30 ? 'warn' : 'bad' });
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

// ── v4 新增：筛选 / 排序 ──
const filterCats = ['', '工具', '食物', '医疗', '武器'];
const filterCat = ref('');
const sortBy = ref('default');
const filteredItems = computed(() => {
  const all = items.value;
  if (!filterCat.value) return all;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(all)) {
    if ((v as any).分类 === filterCat.value) out[k] = v;
  }
  return out;
});
const sortedItems = computed(() => {
  const entries = Object.entries(filteredItems.value);
  if (sortBy.value === 'weight') entries.sort((a, b) => ((b[1] as any).重量 ?? 0) - ((a[1] as any).重量 ?? 0));
  else if (sortBy.value === 'durability')
    entries.sort((a, b) => ((b[1] as any).耐久度 ?? 0) - ((a[1] as any).耐久度 ?? 0));
  else if (sortBy.value === 'category')
    entries.sort((a, b) => String((a[1] as any).分类).localeCompare(String((b[1] as any).分类)));
  return Object.fromEntries(entries);
});

// ── v4 新增：保质期进度 ──
function freshnessClass(days: number): string {
  if (days <= 1) return 'expired';
  if (days <= 3) return 'soon';
  return 'fresh';
}
function freshnessWidth(days: number): number {
  return Math.max(0, Math.min(100, (days / 7) * 100));
}

// ── v4 新增：物品详情弹窗 ──
const detailItem = ref<{
  name: string;
  icon: string;
  cat: string;
  rows: { label: string; value: string; kind?: string }[];
} | null>(null);
function openDetail(key: string, item: any) {
  const rows: { label: string; value: string; kind?: string }[] = [];
  rows.push({ label: '重量', value: `${(item.重量 ?? 0).toFixed(1)}kg` });
  if (item.位置) rows.push({ label: '位置', value: item.位置 });
  if (item.分类) rows.push({ label: '分类', value: item.分类 });
  if (item.数量) rows.push({ label: '数量', value: `×${item.数量}` });
  if (item.耐久度 != null)
    rows.push({
      label: '耐久度',
      value: `${item.耐久度}%`,
      kind: item.耐久度 > 60 ? 'good' : item.耐久度 > 30 ? 'warn' : 'bad',
    });
  if (item.保质期天 != null)
    rows.push({
      label: '保质期',
      value: `${item.保质期天}天`,
      kind: item.保质期天 <= 1 ? 'bad' : item.保质期天 <= 3 ? 'warn' : 'good',
    });
  if (item.锋利度 != null) rows.push({ label: '锋利度', value: `${item.锋利度}%` });
  if (item.电量 != null) rows.push({ label: '电量', value: `${item.电量}%` });
  if (item.保暖值 != null) rows.push({ label: '保暖值', value: String(item.保暖值) });
  if (item.破损度 != null)
    rows.push({ label: '破损度', value: `${item.破损度}%`, kind: item.破损度 > 0 ? 'warn' : 'good' });
  if (item.描述) rows.push({ label: '描述', value: item.描述 });
  detailItem.value = {
    name: item.名称 || key,
    icon: itemIcon(item),
    cat: `${item.分类 || ''}${item.耐久度 != null ? ' · 耐久 ' + item.耐久度 + '%' : ''}`,
    rows,
  };
}
function closeDetail() {
  detailItem.value = null;
}
function useItem(action: string) {
  if (!detailItem.value) return;
  const name = detailItem.value.name;
  const desc = `${action}${name}`;
  _.set(store.data, '$前端操作', `玩家${desc}`);
  toastr.info(`已记录：${desc}`);
  closeDetail();
}

// ── v4 新增：拖拽换位 ──
const dragKey = ref<string | null>(null);
const dragOverKey = ref<string | null>(null);
function onDragStart(_e: DragEvent, key: string) {
  dragKey.value = key;
}
function onDragEnd() {
  dragKey.value = null;
  dragOverKey.value = null;
}
function onDragOver(key: string) {
  if (dragKey.value && dragKey.value !== key) dragOverKey.value = key;
}
function onDragLeave() {
  dragOverKey.value = null;
}
function onDrop(targetKey: string) {
  if (!dragKey.value || dragKey.value === targetKey) {
    dragKey.value = null;
    dragOverKey.value = null;
    return;
  }
  const src = items.value[dragKey.value];
  const tgt = items.value[targetKey];
  if (src && tgt) {
    // 交换两个物品的位置
    const tmp = src.位置;
    _.set(store.data, `装备.物品栏.${dragKey.value}.位置`, tgt.位置);
    _.set(store.data, `装备.物品栏.${targetKey}.位置`, tmp);
    _.set(store.data, '$前端操作', '玩家拖拽调整物品位置');
    toastr.info(`${src.名称} ⇄ ${tgt.名称} 位置互换`);
  }
  dragKey.value = null;
  dragOverKey.value = null;
}

// ── v4 新增：营地操作 ──
function campAction(desc: string) {
  _.set(store.data, '$前端操作', desc);
  toastr.info(`已记录：${desc}`);
}
</script>

<style scoped>
.panel {
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 负重面板 */
.weight-panel {
  background: linear-gradient(135deg, #fffdf9, #f6efe4);
  border: 1px solid rgba(140, 126, 108, 0.2);
  border-left: 4px solid var(--accent);
  border-radius: var(--r-lg);
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: var(--shadow-sm);
}
.weight-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}
.weight-ring {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}
.weight-ring-svg {
  width: 80px;
  height: 80px;
  transform: rotate(-90deg);
}
.weight-ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.weight-ring-val {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
}
.weight-ring-lbl {
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.weight-info {
  flex: 1;
}
.weight-big {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}
.weight-max {
  color: var(--text-secondary);
  font-size: 13px;
}
.weight-pct {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.weight-bar {
  height: 8px;
  background: rgba(140, 126, 108, 0.12);
  border-radius: var(--r-pill);
  overflow: hidden;
  margin-top: 6px;
}
.weight-bar i {
  display: block;
  height: 100%;
  border-radius: var(--r-pill);
  transition: width 0.5s var(--ease-out);
}
.weight-warning {
  font-size: 11px;
  color: var(--danger);
  margin-top: 8px;
}

/* 位置分布 */
.load-dist {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}
.ld-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}
.ld-pos {
  width: 64px;
  color: var(--text-secondary);
  font-weight: 500;
}
.ld-track {
  flex: 1;
  height: 8px;
  background: rgba(140, 126, 108, 0.1);
  border-radius: var(--r-pill);
  overflow: hidden;
}
.ld-track i {
  display: block;
  height: 100%;
  border-radius: var(--r-pill);
  transition: width 0.5s var(--ease-out);
}
.ld-val {
  width: 60px;
  text-align: right;
  font-family: var(--font-data);
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 600;
}

/* 摘要卡 */
.summary-card {
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.sec-hdr .sub {
  font-size: 10px;
  font-weight: normal;
  color: var(--text-secondary);
}
.empty-state {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--card-alt);
  border: 1px dashed var(--border);
  border-radius: 6px;
  margin-bottom: 8px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.filter-chip {
  padding: 5px 12px;
  border-radius: var(--r-pill);
  border: 1px solid rgba(140, 126, 108, 0.2);
  background: var(--card);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: var(--text-secondary);
}
.filter-chip:hover {
  background: var(--nav);
}
.filter-chip.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.sort-select {
  padding: 5px 10px;
  border-radius: var(--r-sm);
  border: 1px solid rgba(140, 126, 108, 0.2);
  background: var(--card);
  font-size: 11px;
  font-family: inherit;
  color: var(--text);
  margin-left: auto;
}

/* 物品网格 */
.item-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.item-card {
  background: var(--card);
  border: 1px solid rgba(140, 126, 108, 0.18);
  border-radius: var(--r-md);
  padding: 12px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s var(--ease-out);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.item-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-light);
}
.item-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}
.item-card:hover::before {
  opacity: 0.5;
}
.item-card.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}
.item-card.drag-over {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(168, 68, 52, 0.15);
}
.ic-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.ic-icon {
  font-size: 28px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(140, 126, 108, 0.06);
  border-radius: var(--r-sm);
  flex-shrink: 0;
}
.ic-name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}
.ic-cat {
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.ic-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.ic-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 10px;
  color: var(--text-secondary);
}
.ic-wt {
  font-family: var(--font-data);
  font-weight: 600;
}
.ic-loc {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  font-size: 9px;
  font-weight: 600;
  transition: all 0.2s;
}
.ic-loc.手持 {
  background: rgba(168, 68, 52, 0.1);
  color: var(--accent);
}
.ic-loc.腰挂 {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success);
}
.ic-loc.背包 {
  background: rgba(226, 143, 27, 0.1);
  color: #b06f12;
}
.ic-loc.穿着 {
  background: rgba(52, 138, 167, 0.1);
  color: var(--info);
}
.ic-loc.尾藏 {
  background: rgba(140, 126, 108, 0.1);
  color: var(--text-secondary);
}
.ic-loc.颈间 {
  background: rgba(201, 168, 76, 0.1);
  color: var(--spirit-gold);
}
.ic-loc:hover {
  transform: scale(1.05);
}

/* 保质期进度 */
.freshness-bar {
  height: 4px;
  background: rgba(140, 126, 108, 0.12);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 6px;
}
.freshness-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}
.freshness-bar.fresh i {
  background: var(--success);
}
.freshness-bar.soon i {
  background: var(--warning);
}
.freshness-bar.expired i {
  background: var(--danger);
}

/* 按钮 */
.op-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  gap: 8px;
  flex-wrap: wrap;
}
.op-btn {
  font-size: 12px;
  padding: 8px 16px;
  border-radius: var(--r-pill);
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  color: #fff;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.2s var(--ease-out);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(168, 68, 52, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.op-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(168, 68, 52, 0.35);
}
.op-btn.ghost {
  background: var(--card);
  color: var(--accent);
  border: 1px solid rgba(168, 68, 52, 0.3);
  box-shadow: var(--shadow-sm);
}
.op-btn.ghost:hover {
  background: rgba(168, 68, 52, 0.05);
  border-color: var(--accent);
}

.chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: var(--r-pill);
  font-size: 10px;
  background: rgba(140, 126, 108, 0.08);
  color: var(--text-secondary);
  border: 1px solid rgba(140, 126, 108, 0.15);
  font-weight: 500;
}
.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: var(--r-sm);
  font-size: 10px;
  font-weight: bold;
}
.badge-good {
  background: rgba(76, 175, 80, 0.13);
  color: var(--success);
}
.badge-warn {
  background: rgba(226, 143, 27, 0.14);
  color: #b06f12;
}
.badge-bad {
  background: rgba(224, 73, 60, 0.1);
  color: var(--danger);
}
.badge-info {
  background: rgba(52, 138, 167, 0.1);
  color: var(--info);
}

/* 物品详情弹窗 */
.item-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 37, 32, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 18px;
}
.item-detail-card {
  background: var(--bg);
  border: 1px solid rgba(140, 126, 108, 0.3);
  border-radius: var(--r-xl);
  padding: 20px;
  max-width: 380px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  animation: fadeIn 0.25s ease;
}
.idc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.idc-icon {
  font-size: 40px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(140, 126, 108, 0.06);
  border-radius: var(--r-md);
  flex-shrink: 0;
}
.idc-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
}
.idc-cat {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.idc-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(140, 126, 108, 0.2);
  font-size: 12px;
}
.idc-row:last-child {
  border-bottom: none;
}
.dr-val {
  font-family: var(--font-data);
  font-weight: 600;
  text-align: right;
}
.dr-val.good {
  color: var(--success);
}
.dr-val.warn {
  color: #b06f12;
}
.dr-val.bad {
  color: var(--danger);
}
.idc-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>
