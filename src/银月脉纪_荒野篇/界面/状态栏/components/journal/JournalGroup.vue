<template>
  <div class="panel">
    <!-- 图鉴完成度 -->
    <div class="sec-hdr">📊 图鉴完成度</div>
    <div class="completion-bar">
      <div v-for="cat in completionData" :key="cat.label" class="comp-item">
        <div class="comp-ring">
          <svg class="comp-ring-svg" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(140,126,108,.12)" stroke-width="4" />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              :stroke="cat.color"
              stroke-width="4"
              stroke-linecap="round"
              :stroke-dasharray="compCirc"
              :stroke-dashoffset="cat.offset"
            />
          </svg>
          <div class="comp-ring-center">{{ cat.pct }}%</div>
        </div>
        <div class="comp-label">{{ cat.label }} {{ cat.count }}</div>
      </div>
    </div>

    <!-- 野兽图鉴 -->
    <div class="sec-hdr">🐾 野兽图鉴 <span class="sub">自动收录</span></div>
    <div v-if="Object.keys(beasts).length === 0" class="empty-state">
      尚未遭遇任何生物<br />首次遭遇后会自动收录图鉴条目
    </div>
    <div v-for="(b, key) in beasts" :key="key" class="beast-card">
      <div class="beast-head">
        <div class="beast-ico">{{ beastIcon(b) }}</div>
        <span class="beast-name">{{ b.名称 }}</span>
        <span :class="['badge', dangerBadge(b.危险等级)]">{{ b.危险等级 }}</span>
      </div>
      <div class="beast-info">
        <b>分类：</b>{{ b.分类 }} · <b>体型：</b>{{ b.体型 }}<br />
        <b>活动：</b>{{ b.活动时段 }} · <b>习性：</b>{{ b.习性 }}<br />
        <b>足迹：</b>{{ b.足迹描述 || '—' }} · <b>可食用：</b>{{ b.是否可食用 || '未知' }}<br />
        <b>遭遇：</b>{{ b.遭遇记录 || '—' }}<br />
        <b>栖息地：</b>{{ b.首次发现地点 || '—' }}
      </div>
      <DetailFold title="遭遇与利用">
        <DataRow label="分类" :value="b.分类" />
        <DataRow label="是否可食用" :value="b.是否可食用 || '未知'" />
        <DataRow label="掉落物" :value="b.掉落物 || '未知'" />
        <DataRow label="首次发现" :value="`${b.首次发现地点} · ${b.首次发现时间 || ''}`" />
      </DetailFold>
    </div>

    <!-- 草药图鉴 -->
    <div class="sec-hdr">🌿 草药图鉴</div>
    <div v-if="Object.keys(herbs).length === 0" class="empty-state">尚未识别任何药用植物</div>
    <div v-for="(h, key) in herbs" :key="key" class="beast-card">
      <div class="beast-head">
        <div class="beast-ico">🌿</div>
        <span class="beast-name">{{ h.名称 }}</span>
        <span :class="['toxicity-mark', toxicityClass(h.毒性)]">{{ h.毒性 }}</span>
      </div>
      <div class="beast-info">
        <b>识别：</b>{{ h.识别特征 }}<br />
        <b>功效：</b>{{ h.药用功效 }}<br />
        <b>采集部位：</b>{{ h.采集部位 }} · <b>处理：</b>{{ h.处理方式 }}<br />
        <b>发现地：</b>{{ h.发现地点 || '—' }} · <b>数量：</b>{{ h.采集数量 || 0 }}株
      </div>
      <div v-if="h.禁忌 && h.禁忌 !== '未知'" class="beast-info" style="color: var(--danger)">禁忌：{{ h.禁忌 }}</div>
    </div>

    <!-- 足迹记录 -->
    <div class="sec-hdr">👣 足迹记录</div>
    <div v-if="Object.keys(tracks).length === 0" class="empty-state">尚未发现明显踪迹</div>
    <div v-for="(t, key) in tracks" :key="key" class="card track-card">
      <div class="beast-head">
        <span class="track-name">🐾 {{ t.推测生物 }}</span>
        <span :class="['badge', freshBadge(t.新鲜度)]">{{ t.新鲜度 }}</span>
      </div>
      <div class="beast-info">发现地：{{ t.发现地点 }} · 方向：{{ t.方向 }}</div>
      <div v-if="t.备注" class="beast-info">{{ t.备注 }}</div>
    </div>

    <!-- 日志 -->
    <div class="sec-hdr">📔 日志 <span class="sub">可筛选</span></div>
    <div class="filter-bar">
      <button
        v-for="cat in logCats"
        :key="cat"
        :class="['filter-chip', { active: logFilter === cat }]"
        @click="logFilter = cat"
      >
        {{ cat || '全部' }}
      </button>
    </div>
    <div v-if="Object.keys(logs).length === 0" class="empty-state">度过第一天后开始记录</div>
    <div
      v-for="(entry, date) in filteredLogs"
      :key="date"
      class="log-entry"
      :style="{ borderLeftColor: logColor(logType(entry)) }"
    >
      <div class="log-date">{{ date }} · {{ logType(entry) }}</div>
      {{ logContent(entry) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '../../store';
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';

const store = useDataStore();
const d = computed<any>(() => store.data);
const journal = computed(() => d.value.图鉴 ?? {});
const beasts = computed(() => journal.value.野兽 ?? {});
const herbs = computed(() => journal.value.草药 ?? {});
const tracks = computed(() => journal.value.足迹 ?? {});
const logs = computed(() => journal.value.日志 ?? {});

function dangerBadge(s: string) {
  if (s === '致命') return 'badge-bad';
  if (s === '危险') return 'badge-warn';
  if (s === '警惕') return 'badge-info';
  return 'badge-good';
}
function freshBadge(s: string) {
  if (s === '极新' || s === '新') return 'badge-bad';
  if (s === '较新') return 'badge-warn';
  return 'badge-info';
}

// ── v4 新增：图鉴完成度 ──
const compCirc = 2 * Math.PI * 20; // ≈ 125.6
const BEAST_TOTAL = 8; // 预估总数（用于环形百分比参考）
const HERB_TOTAL = 3;
const TRACK_TOTAL = 2;
const completionData = computed(() => {
  const beastCount = Object.keys(beasts.value).length;
  const herbCount = Object.keys(herbs.value).length;
  const trackCount = Object.keys(tracks.value).length;
  const mk = (count: number, total: number, label: string, color: string) => {
    const pct = Math.round((count / total) * 100);
    return { label, color, count: `${count}/${total}`, pct, offset: compCirc - (Math.min(pct, 100) / 100) * compCirc };
  };
  return [
    mk(beastCount, BEAST_TOTAL, '野兽', '#A84434'),
    mk(herbCount, HERB_TOTAL, '草药', '#4caf50'),
    mk(trackCount, TRACK_TOTAL, '足迹', '#e28f1b'),
  ];
});

// ── v4 新增：野兽图标 ──
function beastIcon(b: any): string {
  const map: Record<string, string> = {
    哺乳类: '🦌',
    鸟类: '🦅',
    爬行类: '🦎',
    鱼类: '🐟',
    节肢类: '🐜',
    妖兽: '👹',
    不明: '❓',
  };
  return map[b.分类] || '🐾';
}

// ── v4 新增：毒性标识 ──
function toxicityClass(t: string): string {
  if (t === '剧毒') return 'toxicity-high';
  if (t === '微毒') return 'toxicity-mild';
  return 'toxicity-safe';
}

// ── v4 新增：日志格式兼容（string | {内容,类型}）──
function logType(entry: any): string {
  if (typeof entry === 'string') return '其他';
  return entry.类型 || '其他';
}
function logContent(entry: any): string {
  if (typeof entry === 'string') return entry;
  return entry.内容 || '';
}

// ── v4 新增：日志筛选 ──
const logCats = ['', '探索', '采集', '危机', '战斗', '制作'];
const logFilter = ref('');
const filteredLogs = computed(() => {
  if (!logFilter.value) return logs.value;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(logs.value)) {
    if (logType(v) === logFilter.value) out[k] = v;
  }
  return out;
});

// ── v4 新增：日志类型颜色 ──
function logColor(type: string): string {
  const map: Record<string, string> = {
    危机: 'var(--danger)',
    战斗: 'var(--danger)',
    探索: 'var(--info)',
    采集: 'var(--success)',
    制作: 'var(--accent)',
    休息: 'var(--text-secondary)',
    其他: 'var(--accent)',
  };
  return map[type] || 'var(--accent)';
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
.sec-hdr .sub {
  font-size: 10px;
  font-weight: normal;
  color: var(--text-secondary);
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

/* 完成度环 */
.completion-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.comp-item {
  flex: 1;
  text-align: center;
}
.comp-ring {
  width: 50px;
  height: 50px;
  margin: 0 auto;
  position: relative;
}
.comp-ring-svg {
  width: 50px;
  height: 50px;
  transform: rotate(-90deg);
}
.comp-ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-data);
  font-size: 10px;
  font-weight: 700;
}
.comp-label {
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 野兽/草药卡 */
.beast-card {
  background: var(--card);
  border: 1px solid rgba(140, 126, 108, 0.18);
  border-radius: var(--r-md);
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}
.beast-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.beast-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.beast-name {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  flex: 1;
}
.beast-ico {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(140, 126, 108, 0.06);
  border-radius: var(--r-sm);
}
.beast-info {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.7;
}
.beast-info b {
  color: var(--text);
}

/* 足迹卡 */
.track-card {
  padding: 12px 14px;
}
.track-name {
  font-size: 13px;
  font-weight: 700;
  flex: 1;
}

/* 毒性标识 */
.toxicity-mark {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: var(--r-sm);
  font-size: 9px;
  font-weight: bold;
}
.toxicity-safe {
  background: rgba(76, 175, 80, 0.13);
  color: var(--success);
}
.toxicity-mild {
  background: rgba(226, 143, 27, 0.13);
  color: #b06f12;
}
.toxicity-high {
  background: rgba(224, 73, 60, 0.13);
  color: var(--danger);
}

/* 日志筛选 */
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

/* 日志条目 */
.log-entry {
  background: var(--card);
  border: 1px solid rgba(140, 126, 108, 0.18);
  border-left: 4px solid var(--accent);
  border-radius: var(--r-md);
  padding: 12px 14px;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.7;
  box-shadow: var(--shadow-sm);
}
.log-date {
  font-family: var(--font-data);
  font-size: 10px;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
.sec-hdr {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  border-bottom: 2px solid rgba(140, 126, 108, 0.25);
  padding-bottom: 6px;
  margin: 18px 0 10px;
}
.card {
  background: var(--card);
  border: 1px solid rgba(140, 126, 108, 0.18);
  border-radius: var(--r-md);
  padding: 13px 15px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-sm);
}
</style>
