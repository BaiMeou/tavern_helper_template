<template>
  <div class="panel" :class="{ locked: !isUnlocked }">
    <div v-if="!isUnlocked" class="empty-state">🔒 尚未解锁<br />搭建第一处庇护所后解锁营地管理面板</div>

    <template v-else>
      <!-- 庇护所面板 -->
      <div class="shelter-panel">
        <div class="sp-title">🏠 庇护所</div>
        <div class="sp-body">
          类型：{{ shelter.类型 }} · 完整度：<span
            :class="['badge', shelter.完整度 > 60 ? 'badge-good' : shelter.完整度 > 30 ? 'badge-warn' : 'badge-bad']"
            >{{ shelter.完整度 ?? 0 }}%</span
          ><br />
          舒适度：{{ shelter.舒适度 ?? 0 }}/10 · 防风：{{ shelter.防风性 }} · 防水：{{ shelter.防水性 }}<br />
          <span v-if="shelter.内部温差" style="color: var(--success)">内部比外面暖 {{ shelter.内部温差 }}°C</span>
        </div>
      </div>

      <!-- 篝火面板 -->
      <div class="fire-panel">
        <svg viewBox="0 0 56 56" width="112" height="112">
          <!-- 柴火 -->
          <g transform="translate(28, 44)">
            <rect x="-16" y="-3" width="32" height="5" rx="1.5" fill="#8C7E6C" transform="rotate(15)" />
            <rect x="-16" y="-3" width="32" height="5" rx="1.5" fill="#615343" transform="rotate(-15)" />
          </g>
          <!-- 火焰（点燃时显示） -->
          <template v-if="fire.状态 !== '未点燃' && fire.状态 !== '熄灭'">
            <path
              class="fire-flame-path"
              d="M28,42 Q16,30 18,18 Q20,6 28,2 Q36,6 38,18 Q40,30 28,42 Z"
              fill="#e0493c"
              opacity="0.85"
            />
            <path
              class="fire-flame-path"
              d="M28,40 Q20,30 22,20 Q23,12 28,8 Q33,12 34,20 Q36,30 28,40 Z"
              fill="#e28f1b"
              opacity="0.9"
              style="animation-delay: 0.15s"
            />
            <path
              class="fire-flame-path"
              d="M28,38 Q23,30 24,23 Q25,17 28,14 Q31,17 32,23 Q33,30 28,38 Z"
              fill="#ffd180"
              opacity="0.95"
              style="animation-delay: 0.3s"
            />
            <!-- 火星 -->
            <circle cx="22" cy="12" r="1.2" fill="#e28f1b" opacity="0.8">
              <animate attributeName="cy" values="12;2" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="34" cy="15" r="1" fill="#e0493c" opacity="0.8">
              <animate attributeName="cy" values="15;4" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </template>
        </svg>
        <div class="fire-info">
          <div
            class="fire-temp"
            :style="{ color: fire.状态 === '未点燃' || fire.状态 === '熄灭' ? 'var(--danger)' : 'var(--warning)' }"
          >
            {{ fire.状态 }}
          </div>
          <div class="fire-meta">
            中心 {{ fire.中心温度 }}°C · 辐射 {{ fire.热辐射半径 }}m · 燃料{{ fire.燃料余量 }}分
            <template v-if="fire.状态 !== '未点燃' && fire.状态 !== '熄灭'"><br />{{ fire.燃料类型 }}</template>
          </div>
        </div>
        <button v-if="fire.状态 === '未点燃' || fire.状态 === '熄灭'" class="op-btn" @click="igniteFire">
          🔥 点燃
        </button>
        <button v-else class="op-btn ghost" @click="op('添柴', '向篝火添柴')">🪵 添柴</button>
      </div>

      <DetailFold title="篝火参数">
        <DataRow label="火心温度" :value="`${fire.中心温度}°C`" />
        <DataRow label="取暖范围" :value="`${fire.热辐射半径}m`" term="热辐射半径" />
        <DataRow
          label="还能烧多久"
          :value="`${fire.燃料余量}min`"
          :kind="fire.燃料余量 < 30 ? 'warn' : 'good'"
          term="燃料余量"
        />
        <DataRow label="每分钟耗料" :value="`${fire.消耗率}g`" />
        <Formula>点燃所需：火源 + 引火物 + 干燥燃料 · 雨天难度 +30%</Formula>
      </DetailFold>

      <!-- 营地升级树 -->
      <div class="sec-hdr">📈 营地升级</div>
      <div class="upgrade-tree">
        <div v-for="node in upgradeNodes" :key="node.label" :class="['upgrade-node', node.state]">
          <div class="upgrade-icon">{{ node.icon }}</div>
          {{ node.label }}
          <span class="upgrade-req">{{ node.req }}</span>
        </div>
      </div>

      <!-- 储水 -->
      <div class="sec-hdr">💧 储水 <span class="sub">可操作</span></div>
      <div v-if="Object.keys(water).length === 0" class="empty-state">尚无储水</div>
      <div v-for="(wt, key) in water" :key="key" class="card water-card">
        <div class="water-container">
          <div class="water-level" :style="{ height: waterHeight(wt) + '%' }"></div>
        </div>
        <div class="water-info">
          <div class="water-name">{{ key }}</div>
          <div class="water-meta">{{ wt.容器 }} · {{ wt.容量 }}L</div>
          <div class="water-quality">
            <span :class="['badge', 水质Badge(wt.水质)]">{{ wt.水质 }}</span>
          </div>
        </div>
        <div class="water-ops">
          <button class="op-btn ghost" @click="op('取水', `前往取水到${key}`)">💧 取水</button>
          <button v-if="wt.水质 === '生水'" class="op-btn ghost" @click="op('煮沸', `煮沸${key}的水`)">🔥 煮沸</button>
          <button v-if="wt.水质 === '可饮用'" class="op-btn ghost" @click="op('饮用', `饮用${key}的水`)">
            🥤 饮用
          </button>
        </div>
      </div>

      <!-- 食物库存 -->
      <div class="sec-hdr">🍖 食物库存 <span class="sub">可操作</span></div>
      <div v-if="Object.keys(food).length === 0" class="empty-state">尚无库存</div>
      <div v-for="(fd, key) in food" :key="key" class="card">
        <div class="food-head">
          <span class="food-name">{{ fd.物品引用 || key }} ×{{ fd.数量 }}{{ fd.单位 }}</span>
          <span
            class="food-days"
            :style="{
              color:
                fd.保质期剩余天 <= 1 ? 'var(--danger)' : fd.保质期剩余天 <= 3 ? '#b06f12' : 'var(--text-secondary)',
            }"
            >{{ fd.保质期剩余天 }}天</span
          >
        </div>
        <div :class="['freshness-bar', foodFreshness(fd.保质期剩余天)]">
          <i :style="{ width: foodFreshnessWidth(fd.保质期剩余天) + '%' }"></i>
        </div>
        <div class="food-foot">
          <span class="badge" :class="腐败Badge(fd.腐败风险)">{{ fd.腐败风险 }}</span>
          <button class="op-btn ghost" @click="op('食用', `食用${fd.物品引用 || key}`)">🍴 食用</button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="op-line">
        <button class="op-btn ghost" @click="op('清理', '清理腐败食物')">🗑️ 清理</button>
        <button class="op-btn ghost" @click="op('整理', '整理营地')">🧹 整理</button>
        <button class="op-btn ghost" @click="op('加固', '加固营地')">🛠️ 加固</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../store';
import DetailFold from '../shared/DetailFold.vue';
import DataRow from '../shared/DataRow.vue';
import Formula from '../shared/Formula.vue';

const store = useDataStore();
const d = computed(() => store.data);
const shelter = computed(() => d.value.营地?.庇护所 ?? {});
const fire = computed(() => d.value.营地?.篝火 ?? {});
const water = computed(() => d.value.营地?.储水 ?? {});
const food = computed(() => d.value.营地?.食物库存 ?? {});
const 建设状态 = computed(() => d.value.营地?.建设状态 ?? {});

// 解锁判断：庇护所类型非严格后，AI 可写任意非空描述（"天然岩壁凹陷"等）。
// 只要类型存在、非空、非"无"即视为已搭建 → 解锁营地面板。
const isUnlocked = computed(() => {
  const t = shelter.value.类型;
  return !!t && t !== '无' && String(t).trim() !== '';
});

const fireBadge = computed(() => {
  const s = fire.value.状态;
  if (s === '旺盛') return 'badge-good';
  if (s === '点燃' || s === '引火中') return 'badge-warn';
  if (s === '衰减' || s === '余烬') return 'badge-warn';
  return 'badge-bad';
});
function 水质Badge(q: string) {
  if (q === '可饮用') return 'badge-good';
  if (q === '煮沸中' || q === '沉淀中') return 'badge-warn';
  return 'badge-bad';
}
function 腐败Badge(r: string) {
  if (r === '安全') return 'badge-good';
  if (r === '需尽快食用') return 'badge-warn';
  return 'badge-bad';
}

function op(action: string, desc: string) {
  // 玩家操作 = 表达意图 + 静默触发引擎结算。结果由脚本回写后，下一轮 AI 自然读到。
  // 前端只负责：写$前端操作(意图) + 静默写触发字段($掷骰请求等)。不替AI叙事、不显示后端字眼。
  const 天数 = d.value.世界?.时间?.天数 ?? 0;
  const 时段 = d.value.世界?.时间?.时段 ?? '';
  const ts = `第${天数}天 ${时段}`;
  const ops = _.get(store.data, '$近期操作', []) as any[];
  ops.push({ t: ts, text: desc });
  while (ops.length > 5) ops.shift();
  _.set(store.data, '$近期操作', ops);
  _.set(store.data, '$前端操作', desc);
  if (action === '生火') {
    _.set(store.data, '$掷骰请求', {
      类型: '生火',
      雨天: (d.value.世界?.时间?.天气 ?? '').includes('雨'),
      引火物: true,
      时间: ts,
    });
  }
  // 其余操作（添柴/煮沸/饮用/食用）只表达意图，由 AI 下一轮叙事推进，前端不直接改状态
  toastr.info('已记录，等待晓光行动…');
}

// ── v4 新增：点燃篝火 ──
function igniteFire() {
  _.set(store.data, '$前端操作', '玩家点燃篝火');
  _.set(store.data, '$掷骰请求', {
    类型: '生火',
    雨天: (d.value.世界?.时间?.天气 ?? '').includes('雨'),
    引火物: true,
    时间: `第${d.value.世界?.时间?.天数 ?? 0}天 ${d.value.世界?.时间?.时段 ?? ''}`,
  });
  toastr.info('🔥 尝试点燃篝火…');
}

// ── v4 新增：营地升级树 ──
const upgradeNodes = computed(() => {
  const cur = 建设状态.value.当前等级 ?? '无';
  const next = 建设状态.value.下一级需求 ?? '';
  const tree = [
    { label: '临时营地', icon: '🏠', level: '临时' },
    { label: '简易营地', icon: '🪵', level: '简易' },
    { label: '加固庇护所', icon: '🛖', level: '加固' },
    { label: '永久庇护所', icon: '🏕️', level: '永久' },
  ];
  const curIdx = tree.findIndex(n => cur.includes(n.level) || n.level.includes(cur));
  return tree.map((n, i) => ({
    label: n.label,
    icon: n.icon,
    state: i === curIdx ? 'current' : i === curIdx + 1 ? 'next' : i < curIdx ? 'current' : 'locked',
    req: i === curIdx ? '当前' : i === curIdx + 1 ? next || '可升级' : i < curIdx ? '已达成' : '未解锁',
  }));
});

// ── v4 新增：储水水位 ──
function waterHeight(wt: any) {
  const cap = wt.容量 ?? 1;
  // 储水 schema 无当前量字段，用容量近似（有内容则满，无则空）
  return wt.容器 ? Math.min(100, 60) : 0;
}

// ── v4 新增：食物保质期 ──
function foodFreshness(days: number): string {
  if (days <= 1) return 'expired';
  if (days <= 3) return 'soon';
  return 'fresh';
}
function foodFreshnessWidth(days: number): number {
  return Math.max(0, Math.min(100, (days / 7) * 100));
}
</script>

<style scoped>
.panel {
  animation: fadeIn 0.25s ease;
  position: relative;
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
.locked {
  opacity: 0.45;
  filter: grayscale(0.4);
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

/* 庇护所面板 */
.shelter-panel {
  background: linear-gradient(135deg, #fffdf9, #f0ede4);
  border: 1px solid rgba(52, 138, 167, 0.25);
  border-left: 4px solid var(--info);
  border-radius: var(--r-lg);
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-sm);
}
.sp-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  font-family: var(--font-display);
}
.sp-body {
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-secondary);
}

/* 篝火面板 */
.fire-panel {
  background: linear-gradient(135deg, #fffdf9, #fff5e8);
  border: 1px solid rgba(226, 143, 27, 0.3);
  border-left: 4px solid var(--warning);
  border-radius: var(--r-lg);
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 14px;
}
.fire-flame-path {
  transform-origin: center bottom;
  animation: flameFlicker 1.2s ease-in-out infinite;
}
@keyframes flameFlicker {
  0%,
  100% {
    transform: scaleY(1) scaleX(1);
    opacity: 0.95;
  }
  25% {
    transform: scaleY(1.1) scaleX(0.95);
    opacity: 1;
  }
  50% {
    transform: scaleY(0.93) scaleX(1.05);
    opacity: 0.88;
  }
  75% {
    transform: scaleY(1.05) scaleX(0.97);
    opacity: 1;
  }
}
.fire-info {
  flex: 1;
}
.fire-temp {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
}
.fire-meta {
  font-size: 10px;
  color: var(--text-secondary);
}

/* 升级树 */
.upgrade-tree {
  background: rgba(140, 126, 108, 0.04);
  border: 1px solid rgba(140, 126, 108, 0.15);
  border-radius: var(--r-md);
  padding: 14px;
  margin-bottom: 10px;
}
.upgrade-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 11px;
}
.upgrade-node.current {
  color: var(--success);
  font-weight: 600;
}
.upgrade-node.locked {
  color: var(--text-secondary);
  opacity: 0.6;
}
.upgrade-node.next {
  color: var(--accent);
  font-weight: 600;
}
.upgrade-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.upgrade-node.current .upgrade-icon {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}
.upgrade-node.next .upgrade-icon {
  background: rgba(168, 68, 52, 0.1);
  color: var(--accent);
}
.upgrade-node.locked .upgrade-icon {
  background: rgba(140, 126, 108, 0.1);
}
.upgrade-req {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-secondary);
}

/* 储水 */
.water-card {
  display: flex;
  gap: 14px;
  align-items: center;
}
.water-container {
  position: relative;
  width: 40px;
  height: 60px;
  border: 2px solid var(--border);
  border-radius: var(--r-sm);
  overflow: hidden;
  flex-shrink: 0;
}
.water-level {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(52, 138, 167, 0.5), rgba(52, 138, 167, 0.7));
  transition: height 0.5s var(--ease-out);
  border-radius: 0 0 3px 3px;
}
.water-level::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(52, 138, 167, 0.3);
  border-radius: 50%;
  animation: breathe 2s ease-in-out infinite;
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.04);
    opacity: 1;
  }
}
.water-info {
  flex: 1;
}
.water-name {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
}
.water-meta {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.water-quality {
  margin-top: 4px;
}
.water-ops {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 食物 */
.food-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  align-items: center;
}
.food-name {
  font-weight: 600;
}
.food-days {
  font-family: var(--font-data);
  font-weight: 700;
}
.freshness-bar {
  height: 4px;
  background: rgba(140, 126, 108, 0.12);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 6px;
}
.freshness-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}
.freshness-bar.fresh i {
  background: var(--success);
}
.freshness-bar.soon i {
  background: var(--warning);
}
.freshness-bar.expired i {
  background: var(--danger);
}
.food-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

/* 按钮 */
.op-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  gap: 8px;
  flex-wrap: wrap;
}
.op-btn {
  font-size: 12px;
  padding: 8px 16px;
  border-radius: var(--r-pill);
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  color: #fff;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.2s var(--ease-out);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(168, 68, 52, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.op-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(168, 68, 52, 0.35);
}
.op-btn.ghost {
  background: var(--card);
  color: var(--accent);
  border: 1px solid rgba(168, 68, 52, 0.3);
  box-shadow: var(--shadow-sm);
}
.op-btn.ghost:hover {
  background: rgba(168, 68, 52, 0.05);
  border-color: var(--accent);
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
.sec-hdr {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  border-bottom: 2px solid rgba(140, 126, 108, 0.25);
  padding-bottom: 6px;
  margin: 18px 0 10px;
}
</style>
