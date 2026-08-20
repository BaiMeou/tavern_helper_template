<template>
  <div class="top-bar">
    <!-- 荒野永远无信号（恒定）：磁场混乱+无基站，见世界书 场景设定/手机助手系统 -->
    <div>📶 无信号</div>
    <div class="time">{{ timeDisplay }}</div>
    <!-- 无手机条目时隐藏电量区；电量=0 表示手机关机 -->
    <div v-if="battery !== null" class="battery">
      <span :class="['bat-text', battery <= 20 ? 'low' : battery <= 50 ? 'medium' : '']">
        {{ battery === 0 ? '📵 关机' : (battery < 10 ? '🪫 ' + battery + '%' : '🔋 ' + battery + '%') }}
      </span>
      <div class="battery-shell">
        <div class="battery-level" :style="{ width: battery + '%' }" :class="{ low: battery <= 20, medium: battery > 20 && battery <= 50 }"></div>
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
  const 时段 = store.data.世界?.时间?.时段 ?? '—';
  const 天数 = store.data.世界?.时间?.天数 ?? 0;
  return `第${天数}天 · ${时段}`;
});
</script>

<style scoped>
.top-bar {
  background: linear-gradient(135deg, #2C2520, #1f1a17);
  color: var(--nav);
  padding: 6px 14px;
  font-size: 11px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  font-family: var(--font-data);
  letter-spacing: 0.3px;
  box-shadow: 0 2px 6px rgba(44, 37, 32, 0.2);
  position: relative;
  z-index: 10;
}
.top-bar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(234, 223, 201, 0.2), transparent);
}
.time {
  font-weight: bold;
  font-size: 12px;
}
.signal {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.85;
}
.battery {
  display: flex;
  align-items: center;
  gap: 5px;
}
.battery-shell {
  width: 18px;
  height: 9px;
  border: 1px solid var(--nav);
  border-radius: 1px;
  padding: 1px;
  position: relative;
}
.battery-shell::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 4px;
  background: var(--nav);
  border-radius: 0 1px 1px 0;
}
.battery-level {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 1px;
  transition: width 0.3s var(--ease-out), background 0.3s;
}
.battery-level.low {
  background: linear-gradient(90deg, #b8403a, #e0493c);
}
.battery-level.medium {
  background: linear-gradient(90deg, #b06f12, #e28f1b);
}
.bat-text {
  min-width: 34px;
  text-align: right;
}
.bat-text.low { color: #ff8a80; }
.bat-text.medium { color: #ffd180; }
</style>
