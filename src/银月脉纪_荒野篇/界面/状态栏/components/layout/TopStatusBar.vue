<template>
  <div class="top-bar">
    <div>📶 无服务 (OOS)</div>
    <div class="time">{{ timeDisplay }}</div>
    <div class="battery">
      <span>🔋 {{ battery }}%</span>
      <div class="battery-fill">
        <div class="battery-level" :style="{ width: battery + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';

const store = useDataStore();

const battery = computed(() => {
  const 物品栏 = store.data.装备?.物品栏 ?? {};
  // 手机是物品栏里的电子条目，找第一个带电量的电子设备（手机）
  const 手机 = Object.values(物品栏 as Record<string, any>).find(
    (it: any) => it && it.电量 !== undefined && (it.分类 === '电子' || String(it.名称 || '').includes('手机')),
  );
  return 手机?.电量 ?? 96;
});
const timeDisplay = computed(() => {
  const 时段 = store.data.世界?.时间?.时段 ?? '清晨';
  const 天数 = store.data.世界?.时间?.天数 ?? 0;
  return `第${天数}天 · ${时段}`;
});
</script>

<style scoped>
.top-bar {
  background: var(--text);
  color: var(--nav);
  padding: 5px 14px;
  font-size: 11px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.time { font-weight: bold; }
.battery { display: flex; align-items: center; gap: 4px; }
.battery-fill {
  width: 15px; height: 8px;
  border: 1px solid var(--nav);
  padding: 1px;
}
.battery-level {
  height: 100%;
  background: var(--success);
}
</style>
