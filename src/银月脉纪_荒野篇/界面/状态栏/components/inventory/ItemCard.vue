<template>
  <div class="item-card">
    <span class="item-icon">{{ icon }}</span>
    <div class="item-body">
      <div class="item-name">{{ name }}</div>
      <div class="item-desc">{{ desc }}</div>
      <div class="item-meta">
        <DotBadge v-for="b in badges" :key="b.text" :kind="b.kind">{{ b.text }}</DotBadge>
        <span v-for="c in chips" :key="c" class="chip">{{ c }}</span>
      </div>
    </div>
    <div class="item-side">
      <span v-if="weight" class="item-weight">{{ weight }}</span>
      <select v-if="editable" class="loc-select" :value="location" @change="onPosChange">
        <option v-for="p in positions" :key="p.value" :value="p.value">{{ p.short }}</option>
      </select>
      <span v-else-if="location" class="item-location">{{ location }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import DotBadge from '../shared/DotBadge.vue';
import { useDataStore } from '../../store';

const props = defineProps<{
  icon: string; name: string; desc: string; weight?: string; location?: string;
  badges?: { text: string; kind: 'good' | 'warn' | 'bad' | 'info' | 'accent' }[];
  chips?: string[]; editable?: boolean; itemKey?: string;
}>();

// 必须与 schema.ts 装备.物品栏.*.位置 的 z.enum 完整一致（8 个值），
// 否则被 AI 置于缺失位置的物品在 <select> 找不到匹配 option（显示失真且无法移回）。
const positions = [
  { value: '背包', short: '🎒背包' }, { value: '腰挂', short: '🔗腰挂' },
  { value: '手持', short: '✋手持' }, { value: '尾藏', short: '🦊尾藏' },
  { value: '颈间', short: '💎颈间' }, { value: '穿着', short: '👘穿着' },
  { value: '营地存储', short: '🏕️存储' }, { value: '地面', short: '🌍地面' },
];

const store = useDataStore();

function onPosChange(e: Event) {
  const newPos = (e.target as HTMLSelectElement).value;
  if (props.itemKey) {
    const oldPos = _.get(store.data, `装备.物品栏.${props.itemKey}.位置`, '背包');
    _.set(store.data, `装备.物品栏.${props.itemKey}.位置`, newPos);
    const desc = `玩家将「${props.name || props.itemKey}」从${oldPos}移动到${newPos}`;
    // 维护 $近期操作 环形缓冲（保留 5 条），与 CampGroup/WorkshopGroup/ChoiceModal 模式一致
    const 天数 = _.get(store.data, '世界.时间.天数', 0);
    const 时段 = _.get(store.data, '世界.时间.时段', '');
    const ops = _.get(store.data, '$近期操作', []) as any[];
    ops.push({ t: `第${天数}天 ${时段}`, text: desc });
    while (ops.length > 5) ops.shift();
    _.set(store.data, '$近期操作', ops);
    _.set(store.data, '$前端操作', desc);
  }
}
</script>

<style scoped>
.item-card { display: flex; gap: 10px; align-items: center; background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 10px; margin-bottom: 6px; box-shadow: var(--shadow-sm); transition: all .15s; }
.item-card:hover { box-shadow: var(--shadow); border-color: var(--accent-light); }
.item-card.item-accent { border-left: 3px solid var(--accent); }
.item-icon { font-size: 28px; flex-shrink: 0; width: 40px; text-align: center; }
.item-body { flex: 1; min-width: 0; }
.item-name { font-weight: bold; font-size: 13px; margin-bottom: 2px; }
.item-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
.item-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.item-side { text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.item-weight { font-size: 12px; color: var(--text-secondary); font-family: var(--font-data); }
.item-location { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: var(--nav); color: var(--text-secondary); }
.loc-select { padding: 2px 4px; border: 1px solid var(--border); border-radius: 3px; background: var(--card); font-size: 10px; font-family: var(--font-body); color: var(--text); cursor: pointer; }
.chip { padding: 3px 8px; border-radius: 3px; font-size: 10px; background: var(--nav); color: var(--text-secondary); border: 1px solid var(--border); }
</style>
