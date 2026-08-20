<template>
  <div class="home">
    <!-- 主角横幅 + 警报 -->
    <div class="home-hero" :class="heroClass">
      <div class="stamp">荒野<br />求生</div>
      <div class="hero-top">
        <span class="hero-name">晓光</span>
        <span class="hero-meta">九尾白狐娘 · 坠机第 {{ 天数 }} 天 · {{ 时段 }}</span>
      </div>
      <div class="hero-tags">
        <span class="tag">14岁</span>
        <span class="tag">162cm</span>
        <span class="tag">🦊 {{ 九尾状态 }}</span>
        <span class="tag">执念·{{ 执念状态 }}</span>
      </div>

      <!-- 智能诊断 -->
      <div v-if="状态诊断" class="diagnosis" @click="notifyAI('玩家查看诊断详情')">
        <span class="d-icon">🩺</span><span class="d-severity">{{ 诊断严重 ? '危急：' : '提示：' }}</span
        >{{ 状态诊断 }}
      </div>

      <!-- 危机倒计时 -->
      <div v-if="crisisChips.length" class="countdown-bar">
        <div v-for="c in crisisChips" :key="c.label" class="countdown-chip" :class="c.kind">
          <div class="cd-label">{{ c.icon }} {{ c.label }}</div>
          <div class="cd-val">{{ c.val }}</div>
        </div>
      </div>

      <!-- 三资源环 -->
      <div class="rings-row">
        <div v-for="r in rings" :key="r.label" class="ring-wrap" @click="notifyAI(`玩家查看${r.label}详情`)">
          <div class="ring-pos">
            <svg class="ring-svg" viewBox="0 0 70 70">
              <circle class="ring-bg" cx="35" cy="35" r="30" />
              <circle
                class="ring-fill"
                cx="35"
                cy="35"
                r="30"
                :stroke="r.color"
                stroke-dasharray="188.5"
                :stroke-dashoffset="r.offset"
              />
            </svg>
            <div class="ring-center" :style="{ color: r.color }">{{ r.v }}</div>
          </div>
          <div class="ring-label">{{ r.icon }} {{ r.label }}</div>
        </div>
      </div>

      <!-- 生存压力条 -->
      <div class="pressure-bar-wrap">
        <div class="pressure-bar-head">
          <span>⚠️ 生存压力指数</span>
          <span :style="{ color: 压力颜色, fontWeight: 'bold' }">{{ 生存压力指数 }} / 100 · {{ 压力等级 }}</span>
        </div>
        <div class="pressure-bar">
          <div class="pressure-fill" :style="{ width: 生存压力指数 + '%' }"></div>
        </div>
      </div>

      <!-- 天气小卡 -->
      <div class="weather-mini">
        <div class="wm-item">
          <div class="wm-icon">{{ 天气图标 }}</div>
          <div class="wm-val">{{ 天气温度 }}°C</div>
          <div class="wm-lbl">{{ 天气 }}</div>
        </div>
        <div class="wm-item">
          <div class="wm-icon">💨</div>
          <div class="wm-val">{{ 天气风速 }}m/s</div>
          <div class="wm-lbl">{{ 天气风向 }}</div>
        </div>
        <div class="wm-item">
          <div class="wm-icon">💧</div>
          <div class="wm-val">{{ 天气湿度 }}%</div>
          <div class="wm-lbl">湿度</div>
        </div>
      </div>

      <!-- 灵力核心条：纯数值、无上限、动态满格（满格=历史峰值，随新高自动涨） -->
      <div
        class="lingli-bar"
        :class="`lingli-${灵力等级}`"
        :title="`灵力值 ${灵力值} · 峰值 ${灵力峰值} · 满格参考 ${灵力满格参考}`"
      >
        <div v-if="灵力等级 === '全盛' || 灵力等级 === '旺盛'" class="nine-tail-aura"></div>
        <div v-if="灵力等级 === '全盛' || 灵力等级 === '旺盛'" class="spirit-particles"></div>
        <div class="lingli-label">
          <span class="ll-name">🌀 灵力</span>
          <span class="ll-rank">{{ 灵力等级 }}</span>
        </div>
        <div class="lingli-track">
          <div class="lingli-fill" :style="{ width: 灵力条占比 + '%' }"></div>
          <div
            v-if="灵力峰值 > 50 && 灵力峰值 > 灵力值"
            class="lingli-peak"
            :style="{ left: 灵力峰值占比 + '%' }"
            :title="`历史峰值 ${灵力峰值}`"
          ></div>
        </div>
        <div class="lingli-nums">
          <span class="ll-val">{{ 灵力值 }}</span>
          <span class="ll-max">/ {{ 灵力满格参考 }}</span>
          <span class="ll-ratio">· 恢复×{{ 恢复倍率 }} · +{{ 灵力恢复速率 }}/时</span>
        </div>
      </div>

      <!-- 警报 -->
      <div v-if="alerts.length" class="alert-row">
        <div v-for="a in alerts" :key="a.text" class="alert" :class="a.kind">
          <span class="a-ico">{{ a.ico }}</span
          >{{ a.text }}
        </div>
      </div>
    </div>

    <!-- 六边形体征（3×2，每个含 sparkline） -->
    <div class="vitals-honeycomb stagger">
      <div
        v-for="h in hexCards"
        :key="h.label"
        class="hex-card"
        :class="h.kind"
        @click="notifyAI(`玩家关注${h.label}状况`)"
      >
        <div class="hex-ico">{{ h.ico }}</div>
        <div class="hex-val">
          {{ h.display }}<span class="u">{{ h.unit }}</span>
        </div>
        <div class="hex-label">{{ h.label }}</div>
        <div class="hex-bar"><i :style="{ width: h.bar + '%' }"></i></div>
        <svg class="hex-spark" viewBox="0 0 60 14">
          <path :d="h.spark" :stroke="h.sparkColor" />
        </svg>
      </div>
    </div>

    <!-- 副体征 -->
    <div class="sub-vitals">
      <div class="sv">
        <div class="v">{{ 移速修正 >= 0 ? '+' : '' }}{{ 移速修正 }}%</div>
        <div class="l">🏃 移速修正<InfoI term="移速修正" /></div>
      </div>
      <div class="sv">
        <div class="v">{{ 当前负重 }}kg</div>
        <div class="l">🎒 当前负重<InfoI term="当前负重" /></div>
      </div>
      <div class="sv">
        <div class="v">{{ 负载率 }}%</div>
        <div class="l">📦 负载率<InfoI term="负载率" /></div>
      </div>
    </div>

    <!-- 今日时间轴（7 时段，当前高亮） -->
    <div class="timeline">
      <div v-for="(s, i) in 时段列表" :key="s" class="tl-wrap" @click="notifyAI(`玩家查看${s}时段`)">
        <div class="tl-seg" :class="{ passed: i < 当前时段索引, current: i === 当前时段索引 }"></div>
        <div class="tl-label">{{ s }}</div>
      </div>
    </div>

    <!-- 成就统计 -->
    <div class="achievement-row" @click="notifyAI('玩家查看今日成就')">
      <div class="ach-item">
        <div class="ach-icon">🐾</div>
        <div class="ach-val">{{ 今日成就.新物种 ?? 0 }}</div>
        <div class="ach-lbl">新物种</div>
      </div>
      <div class="ach-item">
        <div class="ach-icon">📖</div>
        <div class="ach-val">{{ 今日成就.新配方 ?? 0 }}</div>
        <div class="ach-lbl">新配方</div>
      </div>
      <div class="ach-item">
        <div class="ach-icon">📍</div>
        <div class="ach-val">{{ 今日成就.新地标 ?? 0 }}</div>
        <div class="ach-lbl">新地标</div>
      </div>
    </div>

    <!-- 推荐路线 -->
    <div class="route-card" @click="notifyAI('玩家查看推荐路线')">
      <div class="route-head">🧭 今日推荐</div>
      <div class="route-text">{{ 推荐路线 }}</div>
    </div>

    <!-- 今日近况 -->
    <div v-if="latestLog" class="today"><b>「今日」</b>{{ latestLog }}</div>

    <!-- AI 操作记忆 -->
    <div v-if="recentOps.length && hasTimeProgression" class="oplog">
      <div class="oplog-h"><span class="dot-live"></span>晓光最近的动作（最近{{ recentOps.length }}条）</div>
      <div v-for="(op, i) in recentOps" :key="i" class="oplog-item">
        <span class="t">{{ op.t }}</span>
        <span>{{ op.text }}</span>
      </div>
    </div>

    <!-- 入口 -->
    <div class="entry-grid">
      <div class="entry" @click="$emit('go', 'status')">
        <span class="e-ico">📊</span><span class="e-label">状态</span>
        <span v-if="alertCount" class="e-badge">{{ alertCount }}</span>
      </div>
      <div class="entry" @click="$emit('go', 'inventory')">
        <span class="e-ico">🎒</span><span class="e-label">装备</span>
        <span v-if="itemCount" class="e-badge">{{ itemCount }}</span>
      </div>
      <div class="entry" @click="$emit('go', 'world')">
        <span class="e-ico">🗺️</span><span class="e-label">世界</span>
      </div>
      <div class="entry" @click="$emit('go', 'camp')">
        <span class="e-ico">🏕️</span><span class="e-label">营地</span>
      </div>
      <div class="entry" @click="$emit('go', 'workshop')">
        <span class="e-ico">🛠️</span><span class="e-label">工坊</span>
      </div>
      <div class="entry" @click="$emit('go', 'journal')">
        <span class="e-ico">📖</span><span class="e-label">图鉴</span>
        <span v-if="journalCount" class="e-badge">{{ journalCount }}</span>
      </div>
    </div>

    <div class="term-card" @click="openGlossary('home')">
      <span class="tc-l"><span class="tc-ico">📖</span>这些数字是什么意思？</span>
      <span class="tc-arrow">查看术语说明 ›</span>
    </div>

    <!-- 危险操作：重置存档（始终放最底，低调红字 + 内联展开确认） -->
    <div class="danger-zone">
      <span v-if="!resetIntent" class="dz-link" @click="resetIntent = true">⚠️ 重置存档（从头开始）</span>
      <div v-else class="reset-card">
        <div class="rc-title">⚠️ 确定要重置存档吗？</div>
        <div class="rc-body">
          <p>此操作会<b>清空当前消息楼层与聊天的全部变量</b>：体征、装备、营地、图鉴、坐标、操作记录……一切都会归零。</p>
          <p class="rc-warn">此操作<b>无法撤销</b>。</p>
          <p>清空之后，请前往酒馆主菜单<b>开一个新聊天</b>，初始化向导会重新出现。</p>
        </div>
        <div class="rc-actions">
          <button class="rc-btn cancel" @click="resetIntent = false">取消</button>
          <button class="rc-btn confirm" @click="performReset">我已了解，重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../../store';
import { openGlossary } from '../../glossary';
import InfoI from '../shared/InfoI.vue';

defineEmits<{ go: [tab: string] }>();
const store = useDataStore();
const d = computed<any>(() => store.data);

const 天数 = computed(() => d.value.世界?.时间?.天数 ?? 0);
const 时段 = computed(() => d.value.世界?.时间?.时段 ?? '—');
const 天气 = computed(() => d.value.世界?.时间?.天气 ?? '阴');
const 九尾状态 = computed(() => d.value.晓光?.狐类特性?.九尾状态 ?? '合并一尾');
// ── 灵力核心：纯数值 + 动态满格条 ──
const 灵力值 = computed(() => d.value.晓光?.狐类特性?.灵力值 ?? 20);
const 灵力峰值 = computed(() => d.value.晓光?.狐类特性?.灵力峰值 ?? 20);
const 灵力满格参考 = computed(() => d.value.$灵力满格参考 ?? Math.max(灵力峰值.value, 灵力值.value, 50));
const 灵力等级 = computed(() => d.value.$灵力等级 ?? '未知');
const 恢复倍率 = computed(() => d.value.$恢复倍率 ?? 1);
const 灵力恢复速率 = computed(() => d.value.$灵力恢复速率 ?? 0);
// 条占比：灵力值 / 满格参考（钳到 0-100%）；峰值标记位置同理
const 灵力条占比 = computed(() => Math.max(0, Math.min(100, (灵力值.value / 灵力满格参考.value) * 100)));
const 灵力峰值占比 = computed(() => Math.max(0, Math.min(100, (灵力峰值.value / 灵力满格参考.value) * 100)));
const 执念状态 = computed(() => d.value.晓光?.执念?.状态 ?? '稳固');
const 健康 = computed(() => d.value.晓光?.生存状态?.健康 ?? 0);
const 饥饿 = computed(() => d.value.晓光?.生存状态?.饥饿 ?? 0);
const 口渴 = computed(() => d.value.晓光?.生存状态?.口渴 ?? 0);
const 精力 = computed(() => d.value.晓光?.生存状态?.精力 ?? 0);
const 体温 = computed(() => d.value.晓光?.生存状态?.体温 ?? 36.8);
const 精神 = computed(() => d.value.晓光?.生存状态?.精神 ?? 0);
const 精神区间 = computed(() => d.value.晓光?.$精神区间 ?? '稳定');
const 移速修正 = computed(() => d.value.$移动速度总修正 ?? 0);

const itemCount = computed(() => Object.keys(d.value.装备?.物品栏 ?? {}).length);
const journalCount = computed(() => {
  const j = d.value.图鉴 ?? {};
  return (
    Object.keys(j.野兽 ?? {}).length +
    Object.keys(j.草药 ?? {}).length +
    Object.keys(j.足迹 ?? {}).length +
    Object.keys(j.日志 ?? {}).length
  );
});
const recentOps = computed<{ t: string; text: string }[]>(() => {
  const arr = d.value.$近期操作 ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.slice(-5).reverse();
});
const hasTimeProgression = computed(() => {
  const times = new Set(recentOps.value.map(o => o.t));
  return times.size >= 2;
});
const latestLog = computed(() => {
  const logs = d.value.图鉴?.日志 ?? {};
  const keys = Object.keys(logs).sort();
  if (!keys.length) return '';
  return logs[keys[keys.length - 1]];
});

function kind(v: number, [low, mid]: [number, number]): 'bad' | 'warn' | 'good' {
  if (v <= low) return 'bad';
  if (v <= mid) return 'warn';
  return 'good';
}

const alerts = computed(() => {
  const list: { ico: string; text: string; kind: 'danger' | 'warn' }[] = [];
  const risk = d.value.$失温风险等级;
  if (risk === '极高' || risk === '高')
    list.push({ ico: '⚠️', text: `失温风险${risk} — ${失温建议(d.value)}`, kind: 'danger' });
  else if (risk === '偏高') list.push({ ico: '⚠️', text: `失温风险偏高 — ${失温建议(d.value)}`, kind: 'warn' });

  if (口渴.value <= 30) list.push({ ico: '💧', text: `口渴${口渴.value}% — 严重缺水，需立即饮水`, kind: 'danger' });
  else if (口渴.value <= 50) list.push({ ico: '💧', text: `口渴${口渴.value}% — 该补水了`, kind: 'warn' });

  if (饥饿.value <= 25) list.push({ ico: '🍗', text: `饥饿${饥饿.value}% — 持续扣健康`, kind: 'danger' });
  if (健康.value <= 30) list.push({ ico: '❤️', text: `健康${健康.value}% — 危险`, kind: 'danger' });
  if (精神区间.value === '崩溃' || 精神区间.value === '临界')
    list.push({ ico: '🧠', text: `精神${精神区间.value} — 触发危机`, kind: 'danger' });

  const wounds = d.value.晓光?.伤口 ?? {};
  for (const [name, w] of Object.entries(wounds) as [string, any][]) {
    if (w?.感染风险 === '高' || w?.感染风险 === '已感染') {
      list.push({ ico: '🩹', text: `${name} ${w.感染风险}感染风险`, kind: 'danger' });
      break;
    }
  }
  return list.slice(0, 3);
});
const alertCount = computed(() => alerts.value.length);

function 失温建议(d: any): string {
  const 湿尾 = d?.晓光?.狐类特性?.狐尾湿度 === '湿透';
  const 火 = d?.营地?.篝火?.状态;
  if (湿尾) return '湿尾散热多，先擦干';
  if (火 === '未点燃' || 火 === '熄灭') return '该生火了';
  return '注意保暖';
}

// ─── v4 新增：诊断 / 危机 / 压力 ───
const 状态诊断 = computed(() => d.value.$状态诊断 ?? '');
const 预计危机时间 = computed<number>(() => {
  const v = d.value.$预计危机时间;
  const n = typeof v === 'number' ? v : Number(v);
  return isFinite(n) && n > 0 ? n : Infinity;
});
const 危机时间文本 = computed(() => {
  const m = 预计危机时间.value;
  if (!isFinite(m) || m <= 0) return '—';
  if (m >= 1440) return Math.floor(m / 1440) + '天+';
  if (m >= 60) return Math.floor(m / 60) + '时' + (m % 60 ? (m % 60) + '分' : '');
  return Math.round(m) + '分';
});
const crisisChips = computed(() => {
  const chips: { icon: string; label: string; val: string; kind: 'danger' | 'warn' }[] = [];
  if (isFinite(预计危机时间.value))
    chips.push({ icon: '🚨', label: '危机', val: '~' + 危机时间文本.value, kind: 'danger' });
  const 失温 = d.value.$失温风险等级;
  if (失温 === '极高' || 失温 === '高') chips.push({ icon: '🌡️', label: '失温', val: 失温, kind: 'danger' });
  else if (失温 === '偏高') chips.push({ icon: '🌡️', label: '失温', val: '偏高', kind: 'warn' });
  if (口渴.value <= 30) chips.push({ icon: '💧', label: '脱水', val: 口渴.value + '%', kind: 'danger' });
  if (饥饿.value <= 25) chips.push({ icon: '🍖', label: '饥饿', val: 饥饿.value + '%', kind: 'danger' });
  else if (饥饿.value <= 50) chips.push({ icon: '🍖', label: '饥饿', val: 饥饿.value + '%', kind: 'warn' });
  return chips.slice(0, 3);
});
const 总体健康评分 = computed(() => d.value.$总体健康评分 ?? 0);
const 生存压力指数 = computed(() => d.value.$生存压力指数 ?? 0);
const 压力等级 = computed(() => {
  const v = 生存压力指数.value;
  if (v >= 75) return '高压';
  if (v >= 50) return '中压';
  if (v >= 25) return '低压';
  return '安全';
});
const 压力颜色 = computed(() => {
  const v = 生存压力指数.value;
  if (v >= 75) return 'var(--danger)';
  if (v >= 50) return 'var(--warning)';
  return 'var(--success)';
});
const 诊断严重 = computed(() => alerts.value.some(a => a.kind === 'danger') || 生存压力指数.value >= 70);
const heroClass = computed(() => {
  if (alerts.value.some(a => a.kind === 'danger')) return 'danger';
  if (alerts.value.some(a => a.kind === 'warn')) return 'warn';
  return '';
});

// ─── v4 新增：天气 ───
const 天气温度 = computed(() => d.value.世界?.天气详情?.温度 ?? d.value.$体感温度 ?? 0);
const 天气风速 = computed(() => d.value.世界?.天气详情?.风速 ?? 0);
const 天气风向 = computed(() => d.value.世界?.天气详情?.风向 ?? '—');
const 天气湿度 = computed(() => d.value.世界?.天气详情?.湿度 ?? 0);
const 天气图标 = computed(() => {
  const map: Record<string, string> = {
    晴: '☀️',
    多云: '⛅',
    阴: '☁️',
    微雨: '🌦️',
    大雨: '🌧️',
    暴风雨: '⛈️',
    雾: '🌫️',
    雪: '❄️',
    暴风雪: '🌨️',
  };
  return map[天气.value] ?? '☁️';
});

// ─── v4 新增：三资源环（健康 / 精力 / 精神）───
const RING_C = 188.5; // 2πr (r=30)
function ringColor(v: number): string {
  if (v <= 30) return 'var(--danger)';
  if (v <= 60) return 'var(--warning)';
  return 'var(--success)';
}
const rings = computed(() => {
  const mk = (icon: string, label: string, v: number) => {
    const pct = Math.max(0, Math.min(100, v));
    return {
      icon,
      label,
      v: Math.round(v),
      color: ringColor(v),
      offset: (RING_C * (1 - pct / 100)).toFixed(1),
    };
  };
  return [mk('❤️', '健康', 健康.value), mk('⚡', '精力', 精力.value), mk('🧠', '精神', 精神.value)];
});

// ─── v4 新增：六边形体征（3×2，含 sparkline）───
function sparkPath(value: number): string {
  // 无历史数据时按当前值生成视觉趋势：低值下行、高值上行
  const n = 7;
  const decline = value < 40 ? 7 : value < 60 ? 3 : 0;
  const rise = value > 70 ? 3 : 0;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 60;
    const noise = i % 2 === 0 ? 0.4 : -0.4;
    const base = 7 - (i * decline) / (n - 1) + (i * rise) / (n - 1) + noise;
    const y = Math.max(1.5, Math.min(12.5, base));
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
}
function sparkColor(k: 'bad' | 'warn' | 'good'): string {
  if (k === 'bad') return 'var(--danger)';
  if (k === 'warn') return 'var(--warning)';
  return 'var(--success)';
}
function 体温kind(v: number): 'bad' | 'warn' | 'good' {
  if (v < 36) return 'bad';
  if (v < 36.5) return 'warn';
  return 'good';
}
const hexCards = computed(() => {
  const mk = (ico: string, label: string, val: number, unit: string, k: 'bad' | 'warn' | 'good', dec = false) => ({
    ico,
    label,
    unit,
    kind: k,
    display: dec ? val.toFixed(1) : Math.round(val).toString(),
    bar: Math.max(0, Math.min(100, val)),
    spark: sparkPath(val),
    sparkColor: sparkColor(k),
  });
  return [
    mk('❤️', '健康', 健康.value, '%', kind(健康.value, [30, 60])),
    mk('🍗', '饥饿', 饥饿.value, '%', kind(饥饿.value, [30, 60])),
    mk('💧', '口渴', 口渴.value, '%', kind(口渴.value, [30, 60])),
    mk('⚡', '精力', 精力.value, '%', kind(精力.value, [30, 60])),
    mk('🌡️', '体温', 体温.value, '°', 体温kind(体温.value), true),
    mk('🧠', '精神', 精神.value, '%', kind(精神.value, [30, 60])),
  ];
});

// ─── v4 新增：今日时间轴（7 时段）───
const 时段列表 = ['黎明', '清晨', '正午', '午后', '黄昏', '夜晚', '深夜'];
const 当前时段索引 = computed(() => {
  const i = 时段列表.indexOf(时段.value);
  return i >= 0 ? i : 1;
});

// ─── v4 新增：成就 / 推荐路线 / 负重 ───
const 今日成就 = computed(() => d.value.$今日成就 ?? { 新物种: 0, 新配方: 0, 新地标: 0 });
const 推荐路线 = computed(() => d.value.$今日推荐路线 ?? '保持观察，等待时机');
const 当前负重 = computed(() => d.value.装备?.负重?.当前 ?? 0);
const 负载率 = computed(() => {
  const cur = 当前负重.value;
  const max = d.value.装备?.负重?.安全上限 ?? d.value.装备?.负重?.上限 ?? 10;
  return max > 0 ? Math.min(100, Math.round((cur / max) * 100)) : 0;
});

// ─── 点击交互：通过 $前端操作 告知 AI ───
function notifyAI(action: string) {
  _.set(d.value, '$前端操作', action);
}

// ─── 重置存档 ───
const resetIntent = ref(false);
function performReset() {
  try {
    // 清空当前消息楼层 + chat 级变量。第一条消息楼层（id=0）的 mvu initvar
    // 会在「开新聊天」时重新执行；这里先把当前楼层与 chat 的 stat_data 抹掉，
    // 防止任何残留再被读到。提醒玩家手动开新聊天，让 mvu 走完整 initvar。
    const mid = getCurrentMessageId();
    replaceVariables({}, { type: 'message', message_id: mid });
    try {
      replaceVariables({}, { type: 'chat' });
    } catch {
      /* chat 变量类型可能不可写，忽略 */
    }
    toastr.success('已清空当前楼层与聊天变量。请前往酒馆主菜单 → 开一个新聊天，重新开始你的旅程。', '存档已重置', {
      timeOut: 8000,
    });
  } catch (e) {
    console.error('[reset]', e);
    toastr.error('重置失败：' + ((e as any)?.message ?? e));
  }
  resetIntent.value = false;
}
</script>

<style scoped lang="scss">
.home {
  padding: 14px;
  animation: fadeIn 0.35s var(--ease-out);
}

.home-hero {
  background: linear-gradient(135deg, #fffdf9, #f6efe4);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: var(--r-md);
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.7) inset,
    var(--shadow);
}
.home-hero.danger {
  border-left-color: var(--danger);
  animation: dangerPulse 1.6s ease-in-out infinite;
}
.home-hero.warn {
  border-left-color: var(--warning);
  animation: warnPulse 1.8s ease-in-out infinite;
}

/* 右上角印章 */
.stamp {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 48px;
  height: 48px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: bold;
  color: var(--accent);
  opacity: 0.35;
  transform: rotate(-12deg);
  letter-spacing: 0.5px;
  text-align: center;
  line-height: 1.1;
  pointer-events: none;
}

.hero-top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}
.hero-name {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
}
.hero-meta {
  font-size: 11px;
  color: var(--text-secondary);
}
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 8px 0 12px;
}
.tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--nav);
  color: var(--text-secondary);
  border: 1px solid rgba(140, 126, 108, 0.3);
}

/* ── 智能诊断 ── */
.diagnosis {
  background: linear-gradient(135deg, rgba(224, 73, 60, 0.06), rgba(226, 143, 27, 0.06));
  border: 1px solid rgba(224, 73, 60, 0.2);
  border-radius: var(--r-md);
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.2s;
}
.diagnosis:hover {
  border-color: rgba(224, 73, 60, 0.4);
}
.diagnosis .d-icon {
  font-size: 14px;
  margin-right: 6px;
}
.diagnosis .d-severity {
  font-weight: 700;
  color: var(--danger);
}

/* ── 危机倒计时 ── */
.countdown-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.countdown-chip {
  flex: 1;
  min-width: 100px;
  background: linear-gradient(135deg, rgba(224, 73, 60, 0.08), #fffdf9);
  border: 1px solid rgba(224, 73, 60, 0.25);
  border-radius: var(--r-md);
  padding: 8px 12px;
  text-align: center;
  animation: pulseGlow 2s ease-in-out infinite;
}
.countdown-chip.warn {
  background: linear-gradient(135deg, rgba(226, 143, 27, 0.08), #fffdf9);
  border-color: rgba(226, 143, 27, 0.25);
}
.cd-label {
  font-size: 10px;
  color: var(--text-secondary);
}
.cd-val {
  font-family: var(--font-data);
  font-size: 16px;
  font-weight: 700;
  color: var(--danger);
  margin-top: 2px;
}
.countdown-chip.warn .cd-val {
  color: #b06f12;
}

/* ── 三资源环 ── */
.rings-row {
  display: flex;
  justify-content: space-around;
  margin: 12px 0 16px;
  gap: 6px;
}
.ring-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s var(--ease-out);
}
.ring-wrap:hover {
  transform: translateY(-2px);
}
.ring-pos {
  position: relative;
}
.ring-svg {
  width: 60px;
  height: 60px;
  transform: rotate(-90deg);
  filter: drop-shadow(0 2px 4px rgba(44, 37, 32, 0.1));
}
.ring-bg {
  fill: none;
  stroke: rgba(140, 126, 108, 0.12);
  stroke-width: 5;
}
.ring-fill {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  transition:
    stroke-dashoffset 0.8s var(--ease-out),
    stroke 0.3s;
}
.ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: var(--font-data);
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}
.ring-label {
  font-size: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 500;
}

/* ── 生存压力条 ── */
.pressure-bar-wrap {
  margin: 12px 0 16px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(224, 73, 60, 0.05), rgba(226, 143, 27, 0.05));
  border: 1px solid rgba(140, 126, 108, 0.15);
  border-radius: var(--r-md);
}
.pressure-bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}
.pressure-bar {
  height: 10px;
  background: rgba(140, 126, 108, 0.12);
  border-radius: var(--r-pill);
  overflow: hidden;
  position: relative;
}
.pressure-fill {
  height: 100%;
  border-radius: var(--r-pill);
  background: linear-gradient(90deg, #4caf50, #e28f1b 50%, #e0493c);
  transition: width 0.6s var(--ease-out);
  position: relative;
  overflow: hidden;
}
.pressure-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2.5s infinite linear;
}

/* ── 天气小卡 ── */
.weather-mini {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}
.wm-item {
  background: rgba(52, 138, 167, 0.05);
  border: 1px solid rgba(52, 138, 167, 0.15);
  border-radius: var(--r-md);
  padding: 8px 10px;
  text-align: center;
}
.wm-icon {
  font-size: 20px;
}
.wm-val {
  font-family: var(--font-data);
  font-size: 13px;
  font-weight: 700;
  margin-top: 2px;
}
.wm-lbl {
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: 1px;
}

/* ── 灵力核心条：醒目，区别于 0-100 体征 ── */
.lingli-bar {
  margin: 6px 0 12px;
  padding: 10px 12px;
  border-radius: var(--r-md);
  background: linear-gradient(135deg, rgba(52, 138, 167, 0.06), rgba(168, 140, 52, 0.06));
  border: 1px solid rgba(52, 138, 167, 0.25);
  position: relative;
  overflow: hidden;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}
.lingli-bar.lingli-枯竭 {
  border-color: rgba(224, 73, 60, 0.4);
  background: linear-gradient(135deg, rgba(224, 73, 60, 0.08), rgba(140, 126, 108, 0.04));
}
.lingli-bar.lingli-稀薄 {
  border-color: rgba(226, 143, 27, 0.35);
  background: linear-gradient(135deg, rgba(226, 143, 27, 0.06), rgba(140, 126, 108, 0.04));
}
.lingli-bar.lingli-正常 {
  border-color: rgba(52, 138, 167, 0.3);
}
.lingli-bar.lingli-旺盛 {
  border-color: rgba(76, 175, 80, 0.35);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.06), rgba(168, 140, 52, 0.04));
}
.lingli-bar.lingli-全盛 {
  border-color: rgba(201, 168, 76, 0.45);
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(52, 138, 167, 0.04));
  animation: spiritGlow 2.5s ease-in-out infinite;
}

/* 九尾灵气光晕 + 灵气粒子（仅 旺盛/全盛 显示） */
.nine-tail-aura {
  position: absolute;
  inset: -20px;
  pointer-events: none;
  opacity: 1;
  background: radial-gradient(circle at 50% 50%, rgba(201, 168, 76, 0.15), transparent 70%);
  animation: breathe 4s ease-in-out infinite;
}
.spirit-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(201, 168, 76, 0.5) 1px, transparent 2px),
    radial-gradient(circle at 70% 60%, rgba(52, 138, 167, 0.4) 1px, transparent 2px),
    radial-gradient(circle at 45% 80%, rgba(201, 168, 76, 0.4) 1px, transparent 2px),
    radial-gradient(circle at 85% 25%, rgba(255, 255, 255, 0.5) 1px, transparent 2px);
  background-size:
    40px 40px,
    55px 55px,
    50px 50px,
    35px 35px;
  animation: float 5s ease-in-out infinite;
  opacity: 0.6;
}

.lingli-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}
.ll-name {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.ll-rank {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: rgba(52, 138, 167, 0.15);
  color: var(--info);
}
.lingli-bar.lingli-枯竭 .ll-rank {
  background: rgba(224, 73, 60, 0.15);
  color: var(--danger);
}
.lingli-bar.lingli-稀薄 .ll-rank {
  background: rgba(226, 143, 27, 0.15);
  color: #b06f12;
}
.lingli-bar.lingli-全盛 .ll-rank,
.lingli-bar.lingli-旺盛 .ll-rank {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}
.lingli-track {
  position: relative;
  height: 10px;
  border-radius: var(--r-pill);
  background: rgba(140, 126, 108, 0.15);
  overflow: visible;
  border: 1px solid rgba(140, 126, 108, 0.2);
  z-index: 1;
}
.lingli-fill {
  height: 100%;
  border-radius: var(--r-pill);
  background: linear-gradient(90deg, #348aa7, #6bb6c9 50%, #c9a84c);
  transition: width 0.4s var(--ease-out);
  box-shadow: 0 0 6px rgba(52, 138, 167, 0.3);
  position: relative;
  overflow: hidden;
}
.lingli-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 3s infinite linear;
}
.lingli-bar.lingli-枯竭 .lingli-fill {
  background: linear-gradient(90deg, #8b3a3a, #b84a4a);
  box-shadow: 0 0 6px rgba(224, 73, 60, 0.3);
}
.lingli-bar.lingli-稀薄 .lingli-fill {
  background: linear-gradient(90deg, #b06f12, #e28f1b);
  box-shadow: 0 0 6px rgba(226, 143, 27, 0.3);
}
.lingli-bar.lingli-全盛 .lingli-fill {
  background: linear-gradient(90deg, #4caf50, #8bc34a, #c9a84c);
  box-shadow: 0 0 10px rgba(201, 168, 76, 0.5);
}
.lingli-peak {
  position: absolute;
  top: -2px;
  width: 2px;
  height: 14px;
  background: var(--accent);
  border-radius: 1px;
  box-shadow: 0 0 4px rgba(168, 68, 52, 0.5);
}
.lingli-nums {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 5px;
  position: relative;
  z-index: 1;
}
.ll-val {
  font-family: var(--font-data);
  font-size: 16px;
  font-weight: 700;
  color: var(--info);
}
.ll-max {
  font-size: 10px;
  color: var(--text-secondary);
}
.ll-ratio {
  font-size: 10px;
  color: var(--text-secondary);
  margin-left: auto;
}

/* ── 警报 ── */
.alert-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 4px;
}
.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 11px;
  border-radius: var(--r-md);
  border: 1px solid;
  animation:
    fadeIn 0.3s var(--ease-out),
    pulseGlow 2.2s ease-in-out infinite;
}
.alert.danger {
  background: rgba(224, 73, 60, 0.08);
  border-color: rgba(224, 73, 60, 0.3);
  color: var(--danger);
}
.alert.warn {
  background: rgba(226, 143, 27, 0.08);
  border-color: rgba(226, 143, 27, 0.3);
  color: #b06f12;
}
.alert .a-ico {
  font-size: 15px;
  animation: float 2.5s ease-in-out infinite;
}

/* ── 六边形体征 ── */
.vitals-honeycomb {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.hex-card {
  position: relative;
  background: var(--card);
  border: 1px solid rgba(140, 126, 108, 0.18);
  border-radius: var(--r-md);
  padding: 12px 8px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s var(--ease-out);
  cursor: pointer;
}
.hex-card.bad {
  border-color: rgba(224, 73, 60, 0.4);
  background: linear-gradient(135deg, #fffdf9, #fff5f4);
  animation: dangerPulse 1.6s ease-in-out infinite;
}
.hex-card.warn {
  border-color: rgba(226, 143, 27, 0.4);
  background: linear-gradient(135deg, #fffdf9, #fffbf4);
  animation: warnPulse 1.8s ease-in-out infinite;
}
.hex-card.good {
  border-color: rgba(76, 175, 80, 0.35);
}
.hex-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.hex-ico {
  font-size: 20px;
  animation: float 3s ease-in-out infinite;
}
.hex-card.bad .hex-ico {
  animation: shake 0.8s ease-in-out infinite;
}
.hex-val {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  margin-top: 3px;
}
.hex-card.bad .hex-val {
  color: var(--danger);
}
.hex-card.warn .hex-val {
  color: #b06f12;
}
.hex-val .u {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
}
.hex-label {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 3px;
  letter-spacing: 0.3px;
  font-weight: 500;
}
.hex-bar {
  height: 5px;
  background: rgba(140, 126, 108, 0.12);
  border-radius: var(--r-pill);
  margin-top: 5px;
  overflow: hidden;
}
.hex-bar i {
  display: block;
  height: 100%;
  border-radius: var(--r-pill);
  transition: width 0.5s var(--ease-out);
}
.hex-card.bad .hex-bar i {
  background: linear-gradient(90deg, #b8403a, #e0493c);
}
.hex-card.warn .hex-bar i {
  background: linear-gradient(90deg, #b06f12, #e28f1b);
}
.hex-card.good .hex-bar i {
  background: linear-gradient(90deg, #3d8b40, #4caf50);
}
.hex-spark {
  height: 14px;
  margin-top: 4px;
}
.hex-spark path {
  fill: none;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: sparklineDraw 1s var(--ease-out) forwards;
}

/* ── 副体征 ── */
.sub-vitals {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.sv {
  flex: 1;
  background: var(--card-alt);
  border: 1px solid rgba(140, 126, 108, 0.2);
  border-radius: var(--r-md);
  padding: 8px 10px;
  text-align: center;
}
.sv .v {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
}
.sv .l {
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

/* ── 今日时间轴 ── */
.timeline {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 14px;
  padding: 8px 10px;
  background: rgba(140, 126, 108, 0.05);
  border-radius: var(--r-md);
  border: 1px solid rgba(140, 126, 108, 0.15);
}
.tl-wrap {
  flex: 1;
  position: relative;
  padding-bottom: 14px;
  cursor: pointer;
}
.tl-seg {
  height: 8px;
  border-radius: 2px;
  background: rgba(140, 126, 108, 0.15);
  position: relative;
  transition: all 0.3s var(--ease-out);
}
.tl-seg.passed {
  background: linear-gradient(90deg, var(--accent), var(--accent-light));
  opacity: 0.5;
}
.tl-seg.current {
  background: linear-gradient(90deg, var(--accent), var(--accent-light));
  box-shadow: 0 0 8px var(--accent);
  animation: breathe 2s ease-in-out infinite;
}
.tl-label {
  font-size: 8px;
  color: var(--text-secondary);
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

/* ── 成就统计 ── */
.achievement-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
  cursor: pointer;
}
.ach-item {
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.06), #fffdf9);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: var(--r-md);
  padding: 8px 10px;
  text-align: center;
  transition: transform 0.2s var(--ease-out);
}
.achievement-row:hover .ach-item {
  transform: translateY(-2px);
}
.ach-icon {
  font-size: 18px;
}
.ach-val {
  font-family: var(--font-data);
  font-size: 15px;
  font-weight: 700;
  color: var(--spirit-gold);
  margin-top: 2px;
}
.ach-lbl {
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: 1px;
}

/* ── 推荐路线 ── */
.route-card {
  background: linear-gradient(135deg, rgba(52, 138, 167, 0.06), #fffdf9);
  border: 1px solid rgba(52, 138, 167, 0.2);
  border-left: 4px solid var(--info);
  border-radius: var(--r-md);
  padding: 12px 14px;
  margin-bottom: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.2s var(--ease-out);
}
.route-card:hover {
  transform: translateY(-2px);
}
.route-head {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.route-text {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text);
}

.today {
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: var(--r-md);
  padding: 11px 13px;
  margin-bottom: 14px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.today b {
  color: var(--accent);
  font-family: var(--font-display);
}

.oplog {
  background: linear-gradient(135deg, #f3ece0, #fffdf9);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 10px 12px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}
.oplog-h {
  font-size: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 7px;
  letter-spacing: 0.3px;
}
.oplog-h .dot-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  animation: breathe 2s ease-in-out infinite;
}
.oplog-item {
  font-size: 11px;
  line-height: 1.5;
  padding: 3px 0;
  display: flex;
  gap: 7px;
  color: var(--text-secondary);
}
.oplog-item .t {
  font-family: var(--font-data);
  font-size: 9px;
  color: var(--accent);
  flex-shrink: 0;
  padding-top: 1px;
}
.oplog-item:not(:last-child) {
  border-bottom: 1px dotted rgba(140, 126, 108, 0.2);
}

/* ── 入口网格 ── */
.entry-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 9px;
}
.entry {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 14px 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s var(--ease-out);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.7) inset,
    0 1px 3px rgba(44, 37, 32, 0.07),
    0 2px 6px rgba(44, 37, 32, 0.05);
  position: relative;
}
.entry:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-light);
}
.entry:active {
  transform: translateY(-1px);
}
.entry .e-ico {
  font-size: 26px;
  display: block;
  line-height: 1;
  transition: transform 0.2s var(--ease-out);
}
.entry:hover .e-ico {
  transform: scale(1.12);
}
.entry .e-label {
  font-size: 11px;
  margin-top: 6px;
  font-weight: 500;
}
.entry .e-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: #fff;
  font-size: 9px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeInScale 0.2s var(--ease-out);
}

.term-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f6efe4, #fffdf9);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 11px 13px;
  margin: 18px 0 4px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.15s var(--ease-out);
  position: relative;
}
.term-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--accent);
  opacity: 0.7;
}
.term-card:hover {
  border-color: var(--accent-light);
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}
.term-card .tc-l {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
}
.term-card .tc-l .tc-ico {
  font-size: 16px;
}
.term-card .tc-arrow {
  font-size: 11px;
  color: var(--accent);
}

/* 危险操作区 */
.danger-zone {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px dashed rgba(140, 126, 108, 0.25);
  text-align: center;
}
.dz-link {
  font-size: 11px;
  color: var(--danger);
  cursor: pointer;
  opacity: 0.65;
  user-select: none;
  transition: opacity 0.15s;
  display: inline-block;
  padding: 4px 10px;
}
.dz-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.reset-card {
  background: var(--card);
  border: 2px solid var(--danger);
  border-radius: var(--r-md);
  padding: 16px;
  margin: 4px 0 8px;
  text-align: left;
  box-shadow: 0 4px 18px rgba(184, 64, 58, 0.15);
  animation: slideUp 0.2s var(--ease-out);
}
.rc-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--danger);
  margin-bottom: 10px;
  text-align: center;
}
.rc-body {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text);
}
.rc-body p {
  margin: 0 0 6px;
}
.rc-body p:last-child {
  margin-bottom: 0;
}
.rc-warn {
  color: var(--danger);
  font-weight: 600;
}
.rc-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.rc-btn {
  flex: 1;
  padding: 8px 10px;
  border-radius: var(--r-md);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.12s;
  font-family: inherit;
}
.rc-btn.cancel {
  background: var(--card-alt);
  color: var(--text);
  border-color: var(--border);
}
.rc-btn.cancel:hover {
  background: var(--nav);
}
.rc-btn.confirm {
  background: var(--danger);
  color: #fff;
  border-color: var(--danger);
}
.rc-btn.confirm:hover {
  background: #9a3329;
  border-color: #9a3329;
}
</style>
