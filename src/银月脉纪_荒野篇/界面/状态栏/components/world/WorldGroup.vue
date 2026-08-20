<template>
  <div class="panel">
    <!-- 罗盘 -->
    <div class="compass-wrap">
      <SVGCompass :location="当前位置" :direction="w.风向" />
    </div>

    <!-- 风向指示器 -->
    <div class="wind-indicator">
      <svg viewBox="0 0 60 60" width="100" height="100">
        <circle cx="30" cy="30" r="28" fill="rgba(52,138,167,0.1)" stroke="rgba(52,138,167,0.3)" stroke-width="1" />
        <text x="30" y="11" text-anchor="middle" font-size="8" fill="#615343" font-weight="bold">N</text>
        <text x="30" y="53" text-anchor="middle" font-size="8" fill="#615343" font-weight="bold">S</text>
        <text x="50" y="33" text-anchor="middle" font-size="8" fill="#615343" font-weight="bold">E</text>
        <text x="10" y="33" text-anchor="middle" font-size="8" fill="#615343" font-weight="bold">W</text>
        <g :transform="`translate(30,30) rotate(${windRotation}) translate(-30,-30)`">
          <polygon points="30,14 24,30 30,27 36,30" fill="#348aa7" />
          <rect x="28.5" y="27" width="3" height="14" rx="1" fill="#348aa7" />
        </g>
        <circle cx="30" cy="30" r="2.5" fill="#348aa7" />
      </svg>
      <div class="wind-info">
        风向：<b>{{ w.风向 }}</b
        ><br />风速：<b>{{ fmt(w.风速) }} m/s</b>
      </div>
    </div>

    <!-- 手绘地图 -->
    <div class="sec-hdr">🗺️ 手绘地图</div>
    <div class="hand-map">
      <svg viewBox="0 0 300 160" class="map-svg">
        <!-- 北箭头 -->
        <g transform="translate(22, 22)">
          <polygon points="0,-10 -6,8 0,4 6,8" fill="#615343" />
          <text x="0" y="16" text-anchor="middle" font-size="8" fill="#615343" font-weight="bold">N</text>
        </g>
        <!-- 等高线 -->
        <path
          d="M40,120 Q90,100 150,110 Q210,120 270,100"
          fill="none"
          stroke="rgba(140,126,108,0.35)"
          stroke-width="1"
          stroke-dasharray="5,4"
        />
        <path
          d="M30,135 Q100,115 160,125 Q230,135 280,115"
          fill="none"
          stroke="rgba(140,126,108,0.25)"
          stroke-width="1"
          stroke-dasharray="4,5"
        />
        <!-- 溪流 -->
        <path
          d="M10,80 Q50,60 80,75 Q120,95 150,70 Q190,40 230,55 Q270,70 290,50"
          fill="none"
          stroke="#348aa7"
          stroke-width="2"
          stroke-linecap="round"
        />
        <!-- 地标点 -->
        <g
          v-for="(lm, key) in landmarks"
          :key="key"
          :transform="`translate(${mapCoord(lm.方位).x}, ${mapCoord(lm.方位).y})`"
        >
          <circle r="5" :fill="landmarkColor(lm)" />
          <text y="-8" text-anchor="middle" font-size="8" fill="#615343">{{ lm.名称 }}</text>
        </g>
      </svg>
      <div class="map-legend">
        <span><i style="background: #a84434"></i>当前位置</span>
        <span><i style="background: #4caf50"></i>水源</span>
        <span><i style="background: #348aa7"></i>庇护所</span>
        <span><i style="background: #8c7e6c"></i>遗迹</span>
        <span><i style="background: #e28f1b; opacity: 0.5"></i>未探索</span>
      </div>
    </div>

    <!-- 天气网格 -->
    <div class="sec-hdr">🌤️ 天气与环境</div>
    <div class="weather-grid">
      <div>
        <b>🌡️ 气温</b><span class="v">{{ fmt(w.温度) }}°C</span>
      </div>
      <div>
        <b>❄️ 体感</b><InfoI term="体感温度" /><span class="v">{{ fmt(体感) }}°C</span>
      </div>
      <div>
        <b>💧 湿度</b><span class="v">{{ w.湿度 }}%</span>
      </div>
      <div>
        <b>☁️ 天气</b><span class="v">{{ 天气 }}</span>
      </div>
      <div>
        <b>🌲 树冠</b><span class="v">{{ w.树冠覆盖率 }}%</span>
      </div>
      <div>
        <b>💡 光照</b><span class="v">{{ w.光照明度 }}</span>
      </div>
      <div>
        <b>⚠️ 失温</b><InfoI term="失温风险" /><span class="v"
          ><span :class="['badge', 失温Badge]">{{ 失温风险 }}</span></span
        >
      </div>
      <div>
        <b>📊 气压</b><InfoI term="气压趋势" /><span class="v">{{ w.气压趋势 }}</span>
      </div>
    </div>

    <DetailFold title="失温风险拆解">
      <DataRow label="气温" :value="`${fmt(w.温度)}°C`" />
      <DataRow label="风把体感拉低" :value="`${fmt(风寒)}°C`" kind="warn" term="风寒指数" />
      <DataRow label="总保暖值（衣物加权）" :value="保暖.toFixed(1)" kind="good" />
      <DataRow label="总防风值" :value="防风.toFixed(1)" />
      <DataRow label="湿尾让身体多散热" :value="湿尾 ? '+18W' : '0'" :kind="湿尾 ? 'bad' : 'good'" />
      <DataRow label="庇护所/篝火补偿" :value="`${庇护补偿 + 火补偿}°C`" />
      <DataRow
        label="综合失温风险"
        :value="失温风险"
        :kind="失温风险 === '极高' || 失温风险 === '高' ? 'bad' : 失温风险 === '偏高' ? 'warn' : 'good'"
      />
      <Formula>体感温度 = 气温 − 风的拉低 + 衣物保暖×层次权重×(1−湿度衰减)×(1−破损度) + 火 + 庇护所</Formula>
    </DetailFold>

    <!-- 日照时间轴 -->
    <div class="sec-hdr">🌅 日照时间轴</div>
    <div class="sun-timeline">
      <div class="sun-marker" :style="{ left: sunPosition + '%' }"></div>
      <span class="sun-label" style="left: 10%">🌅 {{ 天体.日出时分 }}</span>
      <span class="sun-label" style="left: 90%">🌇 {{ 天体.日落时分 }}</span>
    </div>
    <div class="sun-now">当前{{ 时段 }} · 距{{ isDay ? '日落' : '日出' }}约 {{ sunHoursLeft }} 小时</div>

    <!-- 四向地形 + 危险标注 -->
    <div class="sec-hdr">🧭 四向地形</div>
    <div class="terrain-grid">
      <div v-for="dir in directions" :key="dir.label" class="terrain">
        <div class="t-ico">{{ dir.icon }}</div>
        <div class="t-body">
          <div class="t-name">
            {{ dir.label }}方 <span class="t-dir">{{ dir.code }}</span
            ><span :class="['danger-mark', dir.danger]"></span>
          </div>
          <div class="t-desc">
            {{ dir.desc }}<template v-if="dir.dangerText"> · {{ dir.dangerText }}</template>
          </div>
        </div>
      </div>
    </div>

    <!-- 动物活动热力图 -->
    <div class="sec-hdr">🐾 动物活动热力图</div>
    <div class="heatmap-labels">
      <span>黎明</span><span>清晨</span><span>正午</span><span>午后</span><span>黄昏</span><span>夜晚</span
      ><span>深夜</span><span>次黎明</span>
    </div>
    <div class="heatmap">
      <div v-for="(cell, i) in heatmapCells" :key="i" :class="heatCellClass(cell)"></div>
    </div>
    <div class="heatmap-note">{{ heatmapNote }}</div>

    <!-- 月相 -->
    <div class="sec-hdr">🌕 月相</div>
    <div class="moon-phase">
      <svg viewBox="0 0 50 50" width="100" height="100">
        <defs>
          <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="25" cy="25" r="20" fill="#2C2520" stroke="#c9a84c" stroke-width="1.2" filter="url(#moonGlow)" />
        <path :d="moonPath" fill="#F4EFEB" opacity="0.92" />
        <circle cx="32" cy="20" r="2.2" fill="rgba(140,126,108,0.25)" />
        <circle cx="36" cy="30" r="1.6" fill="rgba(140,126,108,0.2)" />
        <circle cx="28" cy="34" r="1.3" fill="rgba(140,126,108,0.18)" />
      </svg>
      <div class="moon-info">
        月相：<b>{{ 月相 }}</b
        ><br />夜间能见度：{{ 天体.夜间能见度 }}<br />可见星座：{{ 天体.可见星座 || '—' }}
      </div>
    </div>

    <!-- 水文 -->
    <div class="sec-hdr">💧 水文</div>
    <div class="weather-grid">
      <div>
        <b>溪流水位</b><span class="v">{{ 水文.溪流水位 }}</span>
      </div>
      <div>
        <b>流速</b><span class="v">{{ 水文.流速 }}</span>
      </div>
      <div>
        <b>浑浊度</b
        ><span class="v"
          ><span :class="['badge', 浊度Badge]">{{ 水文.浑浊度 }}</span></span
        >
      </div>
      <div>
        <b>水生生物</b><span class="v">{{ 水文.水生生物 || '—' }}</span>
      </div>
    </div>

    <!-- 地标列表 -->
    <div class="sec-hdr">📍 已知地标</div>
    <div v-if="Object.keys(landmarks).length === 0" class="empty-state">尚未发现地标</div>
    <div v-for="(lm, key) in landmarks" :key="key" class="card landmark-card">
      <span
        ><strong>{{ lm.名称 }}</strong> <span class="badge badge-info">{{ lm.类型 }}</span></span
      >
      <span class="lm-meta" :style="{ color: lm.已探索 ? 'var(--success)' : 'var(--text-secondary)' }">
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
const d = computed(() => store.data);

// 统一数字显示：保留一位小数，与失温拆解中的 .toFixed(1) 风格一致
const fmt = (n: unknown) => (typeof n === 'number' ? n.toFixed(1) : (n ?? ''));

const 当前位置 = computed(() => d.value.世界?.地形?.当前位置 ?? '');
const w = computed(() => d.value.世界?.天气详情 ?? {});
const 天体 = computed(() => d.value.世界?.天体 ?? {});
const 水文 = computed(() => d.value.世界?.水文 ?? {});
const landmarks = computed(() => d.value.世界?.地标 ?? {});
const 天气 = computed(() => d.value.世界?.时间?.天气 ?? '—');
const 时段 = computed(() => d.value.世界?.时间?.时段 ?? '—');
const 危险区域 = computed(() => d.value.世界?.危险区域 ?? {});

const 体感 = computed(() => d.value.$体感温度 ?? 0);
const 风寒 = computed(() => d.value.$风寒拉低 ?? 0);
const 保暖 = computed(() => d.value.$总保暖值 ?? 0);
const 防风 = computed(() => d.value.$总防风值 ?? 0);
const 失温风险 = computed(() => d.value.$失温风险等级 ?? '—');
const 庇护补偿 = computed(() => d.value.$庇护补偿 ?? 0);
const 火补偿 = computed(() => d.value.$火补偿 ?? 0);
const 湿尾 = computed(() => d.value.晓光?.狐类特性?.狐尾湿度 === '湿透');
const 月相 = computed(() => d.value.世界?.天体?.月相 ?? d.value.世界?.时间?.月相 ?? '—');

const 失温Badge = computed(() =>
  失温风险.value === '极高' || 失温风险.value === '高'
    ? 'badge-bad'
    : 失温风险.value === '偏高'
      ? 'badge-warn'
      : 'badge-good',
);
const 浊度Badge = computed(() => {
  const t = 水文.value.浑浊度;
  if (t === '泥浆' || t === '浑浊') return 'badge-bad';
  if (t === '微浊') return 'badge-warn';
  return 'badge-good';
});

// ── v4 新增：方位坐标映射表 ──
const DIR_COORDS: Record<string, { x: number; y: number }> = {
  北: { x: 150, y: 20 },
  南: { x: 150, y: 140 },
  东: { x: 250, y: 80 },
  西: { x: 50, y: 80 },
  东北: { x: 230, y: 30 },
  西北: { x: 70, y: 30 },
  东南: { x: 230, y: 130 },
  西南: { x: 70, y: 130 },
};
function mapCoord(方位: string) {
  return DIR_COORDS[方位] ?? { x: 150, y: 80 };
}
function landmarkColor(lm: any) {
  if (lm.类型 === '水源') return '#4caf50';
  if (lm.类型 === '庇护所') return '#348aa7';
  if (lm.类型 === '遗迹') return '#8C7E6C';
  if (lm.类型 === '危险区') return '#e0493c';
  if (!lm.已探索) return '#e28f1b';
  return '#A84434';
}

// ── v4 新增：风向角度 ──
const WIND_ANGLE: Record<string, number> = {
  北: 180,
  南: 0,
  东: 270,
  西: 90,
  东北: 225,
  西北: 135,
  东南: 315,
  西南: 45,
  无风: 0,
};
const windRotation = computed(() => WIND_ANGLE[w.value.风向] ?? 0);

// ── v4 新增：日照位置 ──
const sunPosition = computed(() => {
  const seg = ['黎明', '清晨', '正午', '午后', '黄昏', '夜晚', '深夜'].indexOf(时段.value);
  if (seg < 0) return 50;
  return Math.round(((seg + 1) / 7) * 100);
});
const isDay = computed(() => !['夜晚', '深夜'].includes(时段.value));
const sunHoursLeft = computed(() => {
  const seg = ['黎明', '清晨', '正午', '午后', '黄昏', '夜晚', '深夜'].indexOf(时段.value);
  if (seg < 0) return '—';
  return isDay.value ? (5 - seg) * 2 : (7 - seg + 5) * 2;
});

// ── v4 新增：四方地形 + 危险标注 ──
const directions = computed(() => {
  const 地形 = d.value.世界?.地形 ?? {};
  const 危险 = 危险区域.value;
  // 按方位找危险区域
  const findDanger = (dir: string) => {
    const match = Object.values(危险).find((dz: any) => dz.方位?.includes(dir));
    if (!match) return { danger: 'low', dangerText: '' };
    const t = (match as any).威胁等级;
    return {
      danger: t === '极高' || t === '高' ? 'high' : t === '中' ? 'mid' : 'low',
      dangerText: (match as any).描述 || (match as any).类型 || '',
    };
  };
  return [
    { label: '北', code: 'N', icon: '🌲', desc: 地形.北方 || '—', ...findDanger('北') },
    { label: '东', code: 'E', icon: '🏞️', desc: 地形.东方 || '—', ...findDanger('东') },
    { label: '南', code: 'S', icon: '🌲', desc: 地形.南方 || '—', ...findDanger('南') },
    { label: '西', code: 'W', icon: '✈️', desc: 地形.西方 || '—', ...findDanger('西') },
  ];
});

// ── v4 新增：动物活动热力图 ──
const 时段列表 = ['黎明', '清晨', '正午', '午后', '黄昏', '夜晚', '深夜'];
const heatmapCells = computed(() => {
  const beasts = d.value.图鉴?.野兽 ?? {};
  const cells: number[] = new Array(8).fill(0); // 8列（含次黎明）
  for (const b of Object.values(beasts) as any[]) {
    const 活动时段 = (b.活动时段 || '').toLowerCase();
    if (活动时段.includes('晨') || 活动时段.includes('黎明')) {
      cells[0] = Math.max(cells[0], 2);
      cells[1] = Math.max(cells[1], 1);
    }
    if (活动时段.includes('昏')) {
      cells[4] = Math.max(cells[4], 3);
    }
    if (活动时段.includes('夜')) {
      cells[5] = Math.max(cells[5], 3);
      cells[6] = Math.max(cells[6], 2);
    }
    if (活动时段.includes('全') || 活动时段.includes('日')) {
      cells[2] = Math.max(cells[2], 1);
      cells[3] = Math.max(cells[3], 1);
    }
  }
  // 当前时段高亮
  const curIdx = 时段列表.indexOf(时段.value);
  if (curIdx >= 0 && cells[curIdx] === 0) cells[curIdx] = 1;
  return cells;
});
const heatmapNote = computed(() => {
  const beasts = Object.values(d.value.图鉴?.野兽 ?? {}) as any[];
  if (!beasts.length) return '尚未发现野兽踪迹';
  const notes = beasts
    .slice(0, 3)
    .map(b => `${b.名称}(${b.活动时段})`)
    .join(' · ');
  const curIdx = 时段列表.indexOf(时段.value);
  const active = beasts.filter(b => (b.活动时段 || '').includes(时段.value[0] || ''));
  return `${notes} · 当前${时段.value}：${active.length > 0 ? active.map(a => a.名称).join('/') + '活跃' : '相对平静'}`;
});

// ── v4 新增：热力图单元格类名（避免 Tailwind 拼接检测）──
function heatCellClass(level: number): string {
  if (level === 1) return 'heat-cell h1';
  if (level === 2) return 'heat-cell h2';
  if (level === 3) return 'heat-cell h3';
  return 'heat-cell';
}

// ── v4 新增：月相 SVG path ──
const moonPath = computed(() => {
  const m = 月相.value;
  // 不同月相的 SVG path（在 50x50 viewBox 内）
  const paths: Record<string, string> = {
    新月: 'M25,5 A20,20 0 1,0 25,45 A20,20 0 1,0 25,5 Z', // 几乎不可见
    蛾眉月: 'M25,5 A20,20 0 1,0 25,45 A15,15 0 1,1 25,5 Z',
    上弦月: 'M25,5 A20,20 0 1,0 25,45 A20,20 0 0,1 25,5 Z',
    盈凸月: 'M25,5 A20,20 0 1,0 25,45 A12,20 0 0,1 25,5 Z',
    满月: 'M25,5 A20,20 0 1,0 25,45 A20,20 0 1,0 25,5 Z',
    亏凸月: 'M25,5 A20,20 0 1,0 25,45 A12,20 0 0,0 25,5 Z',
    下弦月: 'M25,5 A20,20 0 1,0 25,45 A20,20 0 0,0 25,5 Z',
    残月: 'M25,5 A20,20 0 1,0 25,45 A15,15 0 1,0 25,5 Z',
  };
  return paths[m] ?? paths['残月'];
});
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
.compass-wrap {
  text-align: center;
  padding: 12px 0 6px;
  margin-bottom: 8px;
}

/* 风向指示器 */
.wind-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin: 8px 0 14px;
}
.wind-info {
  text-align: left;
  font-size: 11px;
  color: var(--text-secondary);
}
.wind-info b {
  font-family: var(--font-data);
  color: var(--text);
}

/* 手绘地图 */
.hand-map {
  background: linear-gradient(135deg, #fffdf9, #f3ece0);
  border: 1px solid rgba(140, 126, 108, 0.25);
  border-radius: var(--r-md);
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}
.map-svg {
  width: 100%;
  height: 160px;
  background: rgba(140, 126, 108, 0.04);
  border-radius: var(--r-sm);
}
.map-legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 9px;
  color: var(--text-secondary);
}
.map-legend span {
  display: flex;
  align-items: center;
  gap: 3px;
}
.map-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

/* 天气网格 */
.weather-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 12px;
}
.weather-grid > div {
  background: rgba(140, 126, 108, 0.05);
  border: 1px solid rgba(140, 126, 108, 0.15);
  border-radius: var(--r-md);
  padding: 10px 12px;
  transition: all 0.2s;
}
.weather-grid > div:hover {
  background: rgba(140, 126, 108, 0.08);
  transform: translateY(-1px);
}
.weather-grid b {
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--text-secondary);
  margin-bottom: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.weather-grid .v {
  font-family: var(--font-data);
  font-size: 15px;
  font-weight: 700;
}

/* 日照时间轴 */
.sun-timeline {
  background: linear-gradient(
    90deg,
    rgba(44, 37, 32, 0.1),
    rgba(226, 143, 27, 0.15),
    rgba(224, 73, 60, 0.15),
    rgba(226, 143, 27, 0.15),
    rgba(44, 37, 32, 0.1)
  );
  border-radius: var(--r-pill);
  height: 12px;
  position: relative;
  margin: 10px 0;
}
.sun-marker {
  position: absolute;
  top: -4px;
  width: 4px;
  height: 20px;
  background: var(--accent);
  border-radius: 2px;
  box-shadow: 0 0 6px var(--accent);
  transition: left 0.5s var(--ease-out);
}
.sun-label {
  position: absolute;
  top: 18px;
  font-size: 8px;
  color: var(--text-secondary);
  transform: translateX(-50%);
}
.sun-now {
  text-align: center;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 14px;
}

/* 地形卡 */
.terrain-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 12px;
}
.terrain {
  display: flex;
  gap: 12px;
  background: var(--card);
  border: 1px solid rgba(140, 126, 108, 0.18);
  border-radius: var(--r-md);
  padding: 12px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s var(--ease-out);
}
.terrain:hover {
  transform: translateX(2px);
  box-shadow: var(--shadow);
}
.terrain .t-ico {
  font-size: 26px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(140, 126, 108, 0.06);
  border-radius: var(--r-sm);
}
.terrain .t-body {
  flex: 1;
}
.terrain .t-name {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
}
.terrain .t-dir {
  font-size: 10px;
  color: #fff;
  background: var(--accent);
  border-radius: var(--r-pill);
  padding: 2px 8px;
  font-weight: bold;
}
.terrain .t-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 5px;
  line-height: 1.5;
}
.danger-mark {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: auto;
  flex-shrink: 0;
}
.danger-mark.low {
  background: var(--success);
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.4);
}
.danger-mark.mid {
  background: var(--warning);
  box-shadow: 0 0 6px rgba(226, 143, 27, 0.4);
}
.danger-mark.high {
  background: var(--danger);
  box-shadow: 0 0 6px rgba(224, 73, 60, 0.4);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

/* 热力图 */
.heatmap-labels {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.heatmap {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  margin: 8px 0;
}
.heat-cell {
  aspect-ratio: 1;
  border-radius: 2px;
  background: rgba(140, 126, 108, 0.1);
}
.heat-cell.h1 {
  background: rgba(76, 175, 80, 0.3);
}
.heat-cell.h2 {
  background: rgba(226, 143, 27, 0.4);
}
.heat-cell.h3 {
  background: rgba(224, 73, 60, 0.5);
}
.heatmap-note {
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  margin-top: 4px;
  margin-bottom: 12px;
}

/* 月相 */
.moon-phase {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  margin: 10px 0 14px;
}
.moon-info {
  font-size: 11px;
  color: var(--text-secondary);
}
.moon-info b {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--text);
}

/* 地标 */
.landmark-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lm-meta {
  font-size: 11px;
}
.empty-state {
  text-align: center;
  padding: 18px;
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--card-alt);
  border: 1px dashed var(--border);
  border-radius: 6px;
  margin-bottom: 8px;
}
.sec-hdr {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  border-bottom: 2px solid rgba(140, 126, 108, 0.25);
  padding-bottom: 6px;
  margin: 18px 0 10px;
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
</style>
