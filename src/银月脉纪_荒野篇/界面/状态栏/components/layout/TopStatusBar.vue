<template>
  <div class="top-bar">
    <!-- 荒野永远无信号（恒定）：磁场混乱+无基站，见世界书 场景设定/手机助手系统 -->
    <div>📶 无信号</div>
    <div class="time">{{ timeDisplay }}</div>
    <!-- 无手机条目时隐藏电量区；电量=0 表示手机关机 -->
    <div v-if="battery !== null" class="battery">
      <span>{{ battery === 0 ? '📵 关机' : (battery < 10 ? '🪫 ' + battery + '%' : '🔋 ' + battery + '%') }}</span>
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

const battery = computed<number | null>(() => {
  const 物品栏 = store.data.装备?.物品栏 ?? {};
  // 用稳定 key '手机' 定位手机条目（向导写入时 key 即物品 id，见 SetupWizard）
  // 不靠 名称/分类 模糊匹配，避免把头灯/营地灯等其他电子设备的电量误当成手机电量
  const 手机 = (物品栏 as Record<string, any>)['手机'];
  // 无手机条目时返回 null → 顶栏隐藏电量区，而非硬编码 96%
  return 手机?.电量 ?? null;
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
