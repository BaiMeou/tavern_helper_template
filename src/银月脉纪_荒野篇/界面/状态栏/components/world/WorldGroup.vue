<template>
  <div class="panel">
    <div class="card" style="padding:16px;text-align:center;margin-bottom:12px;">
      <SVGCompass :location="当前位置" />
    </div>

    <div class="sec-hdr">🌤️ 天气与环境</div>
    <div class="card">
      <div class="weather-grid">
        <div><strong>🌡️ 气温</strong><br>{{ w.温度 }}°C · 体感 {{ w.体感温度 }}°C</div>
        <div><strong>💧 湿度</strong><br>{{ w.湿度 }}%</div>
        <div><strong>💨 风</strong><br>{{ w.风速 }}m/s {{ w.风向 }}</div>
        <div><strong>🌲 树冠</strong><br>{{ w.树冠覆盖率 }}%</div>
        <div><strong>📊 气压</strong><br>{{ w.气压趋势 }}</div>
        <div><strong>☀️ 光照</strong><br>{{ w.光照明度 }}</div>
        <div><strong>🟫 地表</strong><br>{{ w.地表状况 }}</div>
        <div><strong>⚠️ 失温</strong><br>{{ risk }}</div>
      </div>
    </div>

    <div class="sec-hdr">🗺️ 四向地形</div>
    <div class="terrain-grid">
      <div class="terrain-card" v-for="dir in directions" :key="dir.label">
        <span class="t-icon">{{ dir.icon }}</span>
        <div>
          <div class="t-name">[{{ dir.label }}] {{ dir.title }}</div>
          <div class="t-desc">{{ dir.desc }}</div>
        </div>
      </div>
    </div>

    <div class="sec-hdr">📍 已知地标</div>
    <div v-for="(lm, key) in landmarks" :key="key" class="card" style="display:flex;justify-content:space-between;">
      <span><strong>{{ lm.名称 }}</strong> <span class="badge badge-info">{{ lm.类型 }}</span></span>
      <span style="font-size:11px;" :style="{color: lm.已探索 ? 'var(--success)' : 'var(--text-secondary)'}">
        {{ lm.已探索 ? '已探索' : '未探索' }} · {{ lm.方位 }}·{{ lm.距离 }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import SVGCompass from './SVGCompass.vue';

const store = useDataStore();
const d = computed(() => store.data);

const 当前位置 = computed(() => d.value.世界?.地形?.当前位置 ?? '');
const w = computed(() => d.value.世界?.天气详情 ?? {});
const risk = computed(() => d.value.$失温风险等级 ?? '正常');
const landmarks = computed(() => d.value.世界?.地标 ?? {});

const directions = computed(() => {
  const 地形 = d.value.世界?.地形 ?? {};
  return [
    { label: '北', icon: '🌲', title: '针叶林', desc: 地形.北方 || '' },
    { label: '东', icon: '✈️', title: '飞机残骸', desc: 地形.东方 || '' },
    { label: '南', icon: '🌊', title: '溪流草甸', desc: 地形.南方 || '' },
    { label: '西', icon: '⛰️', title: '碎石坡', desc: 地形.西方 || '' },
  ];
});
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.weather-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
.terrain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
@media (max-width: 380px) { .terrain-grid { grid-template-columns: 1fr; } }
.terrain-card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 10px; display: flex; align-items: flex-start; gap: 10px; font-size: 11px; box-shadow: var(--shadow-sm); }
.t-icon { font-size: 28px; flex-shrink: 0; line-height: 1; }
.t-name { font-weight: bold; font-size: 12px; }
.t-desc { color: var(--text-secondary); margin-top: 2px; line-height: 1.4; }
</style>
