<template>
  <div class="panel">
    <div class="card card-accent">
      <div class="weight-row">
        <span class="weight-value">{{ currentWeight.toFixed(1) }}</span>
        <span class="weight-max">/ {{ safeLimit }} kg</span>
        <DotBadge :kind="weightRatio > 120 ? 'bad' : weightRatio > 100 ? 'warn' : 'good'">
          {{ weightRatio > 120 ? '超重' : weightRatio > 100 ? '满载' : '安全' }}
        </DotBadge>
        <span class="weight-pct">{{ weightRatio }}% · 移速 {{ speedMod }}%</span>
      </div>
      <ProgressBar :current="currentWeight" :max="safeLimit" />
    </div>

    <div class="sec-hdr">🪓 手持与穿着</div>
    <div class="card">
      <strong>手持：</strong>{{ equip.手持 || '空手' }}
      <span style="margin-left:8px;"><strong>穿着：</strong>{{ equip.穿着 || '破损的巫女服' }}</span>
    </div>

    <div class="sec-hdr">🎒 物品清单 <span class="subtle">动态 — AI 随时新增</span></div>
    <div v-if="items.length === 0" class="empty-state">
      物品栏为空<br>AI 会在探索、搜刮、制作时自动添加物品条目
    </div>
    <ItemCard
      v-for="(item, key) in items"
      :key="key"
      :icon="itemIcon(item)"
      :name="item.名称 || key"
      :desc="item.描述 || ''"
      :weight="item.重量 ? item.重量 + 'kg' : ''"
      :location="item.位置 || ''"
      :badges="itemBadges(item)"
      :chips="itemChips(item)"
    />

    <div v-if="Object.keys(containers).length > 0" class="sec-hdr">🫗 容器</div>
    <div v-for="(c, key) in containers" :key="key" class="card">
      <strong>{{ key }}</strong> — {{ c.当前装载 }}/{{ c.容量 }}L
      <span v-if="c.可加热" class="badge badge-good">可加热</span>
      {{ c.装载内容 }}
    </div>

    <div v-if="Object.keys(garments).length > 0" class="sec-hdr">👘 衣物</div>
    <div v-for="(g, key) in garments" :key="key" class="card">
      <strong>{{ key }}</strong> — 保暖{{ g.保暖值 }} 防风{{ g.防风值 }} · 湿度{{ g.湿度 }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import ProgressBar from '../shared/ProgressBar.vue';
import DotBadge from '../shared/DotBadge.vue';
import ItemCard from './ItemCard.vue';

const store = useDataStore();
const d = computed(() => store.data);

const equip = computed(() => d.value.装备 ?? {});
const items = computed(() => d.value.装备?.物品栏 ?? {});
const containers = computed(() => d.value.装备?.容器 ?? {});
const garments = computed(() => d.value.装备?.衣物 ?? {});

const currentWeight = computed(() => d.value.装备?.负重?.当前 ?? 7.5);
const safeLimit = computed(() => d.value.装备?.负重?.安全上限 ?? 9);
const weightRatio = computed(() => Math.round((currentWeight.value / safeLimit.value) * 100));
const speedMod = computed(() => d.value.$移动速度总修正 ?? -5);

function itemIcon(item: any): string {
  const map: Record<string, string> = {
    '工具':'🔧','容器':'🫗','食物':'🍞','庇护':'⛺','武器':'⚔️',
    '医疗':'🩹','电子':'📱','特殊':'📦','材料':'🧱','自制':'🔨',
    '弹药':'🎯',
  };
  return map[item.分类] || '📦';
}
function itemBadges(item: any) {
  const badges: any[] = [];
  if (item.耐久度 !== undefined) badges.push({ text: `耐久 ${item.耐久度}%`, kind: item.耐久度 > 60 ? 'good' : item.耐久度 > 30 ? 'warn' : 'bad' });
  if (item.数量) badges.push({ text: `×${item.数量}`, kind: 'info' });
  return badges;
}
function itemChips(item: any) {
  const chips: string[] = [];
  if (item.保质期天) chips.push(`保质${item.保质期天}天`);
  if (item.锋利度) chips.push(`锋利${item.锋利度}%`);
  if (item.电量) chips.push(`电量${item.电量}%`);
  return chips;
}
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.weight-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.weight-value { font-size: 28px; font-weight: bold; font-family: var(--font-display); }
.weight-max { color: var(--text-secondary); }
.weight-pct { font-size: 11px; color: var(--text-secondary); margin-left: auto; }
.subtle { font-weight: normal; font-size: 11px; color: var(--text-secondary); }
.empty-state { text-align: center; padding: 20px; font-size: 12px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 4px; margin-bottom: 8px; }
</style>
