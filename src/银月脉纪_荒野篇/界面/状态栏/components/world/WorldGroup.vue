<template>
  <div class="panel">
    <div class="card compass-wrap">
      <SVGCompass :location="当前位置" />
    </div>

    <div class="sec-hdr">🌤️ 天气与环境</div>
    <div class="weather-grid">
      <div><b>🌡️ 气温</b><br>{{ w.温度 }}°C · 体感 {{ 体感 }}°C<InfoI term="体感温度" /></div>
      <div><b>💨 风</b><br>{{ w.风速 }}m/s {{ w.风向 }}</div>
      <div><b>💧 湿度</b><br>{{ w.湿度 }}%</div>
      <div><b>⚠️ 失温</b><InfoI term="失温风险" /><br><span :class="['badge', 失温Badge]">{{ 失温风险 }}</span></div>
      <div><b>📊 气压走势</b><InfoI term="气压趋势" /><br>{{ w.气压趋势 }}</div>
      <div><b>🌲 树冠</b><br>{{ w.树冠覆盖率 }}%</div>
      <div><b>🟫 地表</b><br>{{ w.地表状况 }}</div>
      <div><b>☀️ 光照</b><br>{{ w.光照明度 }}</div>
    </div>

    <DetailFold title="失温风险拆解">
      <DataRow label="气温" :value="`${w.温度}°C`" />
      <DataRow label="风把体感拉低" :value="`${风寒}°C`" kind="warn" term="风寒指数" />
      <DataRow label="总保暖值（衣物加权）" :value="保暖.toFixed(1)" kind="good" />
      <DataRow label="总防风值" :value="防风.toFixed(1)" />
      <DataRow label="湿尾让身体多散热" :value="湿尾?'+18W':'0'" :kind="湿尾?'bad':'good'" />
      <DataRow label="庇护所/篝火补偿" :value="`${(庇护补偿+火补偿)}°C`" />
      <DataRow label="综合失温风险" :value="失温风险" :kind="失温风险==='极高'||失温风险==='高'?'bad':失温风险==='偏高'?'warn':'good'" />
      <Formula>体感温度 = 气温 − 风的拉低 + 衣物保暖×(1−湿度衰减) + 火 + 庇护所</Formula>
    </DetailFold>

    <div class="sec-hdr">🌙 天体 · 时间</div>
    <div class="card" style="font-size:12px;line-height:1.8">
      日出 {{ 天体.日出时分 }} · 日落 {{ 天体.日落时分 }} · 月相 <span class="chip">{{ 月相 }}</span><InfoI term="月相" /><br>
      夜间能见度：{{ 天体.夜间能见度 }} · {{ 天体.可见星座 }}
    </div>

    <div class="sec-hdr">💧 水文</div>
    <div class="card" style="font-size:12px;line-height:1.8">
      溪流：<span class="chip">{{ 水文.溪流水位 }}</span> · 流速{{ 水文.流速 }} · <span :class="['badge', 浊度Badge]">{{ 水文.浑浊度 }}</span><br>
      水生生物：{{ 水文.水生生物 }}<br>
      雨水收集效率：{{ 水文.雨水收集效率 }} mL/h
    </div>

    <div class="sec-hdr">🧭 四向地形</div>
    <div class="terrain-grid">
      <div class="terrain-card" v-for="dir in directions" :key="dir.label">
        <span class="t-icon">{{ dir.icon }}</span>
        <div>
          <div class="t-name"><span class="t-dir">{{ dir.label }}</span> {{ dir.desc }}</div>
        </div>
      </div>
    </div>

    <div class="sec-hdr">📍 已知地标</div>
    <div v-if="Object.keys(landmarks).length === 0" class="empty-state">尚未发现地标</div>
    <div v-for="(lm, key) in landmarks" :key="key" class="card" style="display:flex;justify-content:space-between;align-items:center;">
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
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';
import Formula from '../shared/Formula.vue';
import InfoI from '../shared/InfoI.vue';

const store = useDataStore();
const d = computed<any>(() => store.data);

const 当前位置 = computed(() => d.value.世界?.地形?.当前位置 ?? '');
const w = computed(() => d.value.世界?.天气详情 ?? {});
const 天体 = computed(() => d.value.世界?.天体 ?? {});
const 水文 = computed(() => d.value.世界?.水文 ?? {});
const landmarks = computed(() => d.value.世界?.地标 ?? {});

const 体感 = computed(() => d.value.$体感温度 ?? 2);
const 风寒 = computed(() => d.value.$风寒拉低 ?? 5);
const 保暖 = computed(() => d.value.$总保暖值 ?? 3.5);
const 防风 = computed(() => d.value.$总防风值 ?? 2);
const 失温风险 = computed(() => d.value.$失温风险等级 ?? '正常');
const 庇护补偿 = computed(() => d.value.$庇护补偿 ?? 0);
const 火补偿 = computed(() => d.value.$火补偿 ?? 0);
const 湿尾 = computed(() => d.value.晓光?.狐类特性?.狐尾湿度 === '湿透');
const 月相 = computed(() => d.value.世界?.天体?.月相 ?? d.value.世界?.时间?.月相 ?? '残月');

const 失温Badge = computed(() => 失温风险.value === '极高' || 失温风险.value === '高' ? 'badge-bad' : 失温风险.value === '偏高' ? 'badge-warn' : 'badge-good');
const 浊度Badge = computed(() => {
  const t = 水文.value.浑浊度;
  if (t === '泥浆' || t === '浑浊') return 'badge-bad';
  if (t === '微浊') return 'badge-warn';
  return 'badge-good';
});

const directions = computed(() => {
  const 地形 = d.value.世界?.地形 ?? {};
  return [
    { label: '北', icon: '🌲', desc: 地形.北方 || '' },
    { label: '东', icon: '✈️', desc: 地形.东方 || '' },
    { label: '南', icon: '🌊', desc: 地形.南方 || '' },
    { label: '西', icon: '⛰️', desc: 地形.西方 || '' },
  ];
});
</script>

<style scoped>
.panel { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.compass-wrap { text-align: center; padding: 16px; margin-bottom: 12px; }
.weather-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
.weather-grid > div { background: var(--card-alt); border: 1px solid rgba(140,126,108,.2); border-radius: 6px; padding: 8px 10px; }
.weather-grid b { font-size: 11px; display: flex; align-items: center; gap: 3px; }
.terrain-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
.terrain-card { background: var(--card); border: 1px solid var(--border); border-radius: 6px; padding: 10px; display: flex; align-items: flex-start; gap: 10px; font-size: 11px; box-shadow: var(--shadow-sm); }
.t-icon { font-size: 24px; flex-shrink: 0; line-height: 1; }
.t-name { font-size: 11px; color: var(--text-secondary); line-height: 1.5; }
.t-dir { font-size: 10px; color: #fff; background: var(--accent); border-radius: 3px; padding: 1px 6px; font-weight: bold; margin-right: 4px; }
.empty-state { text-align: center; padding: 18px; font-size: 11px; color: var(--text-secondary); background: var(--card-alt); border: 1px dashed var(--border); border-radius: 6px; }
</style>
