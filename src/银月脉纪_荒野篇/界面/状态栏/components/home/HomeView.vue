<template>
  <div class="home">
    <!-- 主角横幅 + 警报 -->
    <div class="home-hero">
      <div class="hero-top">
        <span class="hero-name">晓光</span>
        <span class="hero-meta">九尾白狐娘 · 坠机第 {{ 天数 }} 天 · {{ 时段 }}</span>
      </div>
      <div class="hero-tags">
        <span class="tag">14岁</span>
        <span class="tag">162cm</span>
        <span class="tag">🦊 {{ 九尾状态 }}</span>
        <span class="tag">灵力{{ 灵力 }}</span>
        <span class="tag">执念·{{ 执念状态 }}</span>
      </div>
      <div v-if="alerts.length" class="alert-row">
        <div v-for="a in alerts" :key="a.text" class="alert" :class="a.kind">
          <span class="a-ico">{{ a.ico }}</span>{{ a.text }}
        </div>
      </div>
    </div>

    <!-- 4 大体征 -->
    <div class="vitals-hero">
      <VitalHero icon="❤️" label="健康" :value="健康" :max="100" :kind="kind(健康, [30,60])" term="健康" />
      <VitalHero icon="🍗" label="饥饿" :value="饥饿" :max="100" :kind="kind(饥饿, [30,60])" term="饥饿" />
      <VitalHero icon="💧" label="口渴" :value="口渴" :max="100" :kind="kind(口渴, [30,60])" term="口渴" />
      <VitalHero icon="⚡" label="精力" :value="精力" :max="100" :kind="kind(精力, [30,60])" term="精力" />
    </div>

    <!-- 副体征 -->
    <div class="sub-vitals">
      <div class="sv">
        <div class="v">{{ 体温.toFixed(1) }}°</div>
        <div class="l">🌡️ 核心体温<InfoI term="核心体温" /></div>
      </div>
      <div class="sv">
        <div class="v">{{ 精神 }}</div>
        <div class="l">🧠 精神·{{ 精神区间 }}<InfoI term="精神" /></div>
      </div>
      <div class="sv">
        <div class="v">{{ 移速修正 >= 0 ? '+' : '' }}{{ 移速修正 }}%</div>
        <div class="l">🏃 移速修正<InfoI term="移速修正" /></div>
      </div>
    </div>

    <!-- 今日近况 -->
    <div class="today" v-if="latestLog">
      <b>「今日」</b>{{ latestLog }}
    </div>

    <!-- AI 操作记忆 -->
    <div v-if="recentOps.length" class="oplog">
      <div class="oplog-h"><span class="dot-live"></span>晓光最近的动作（最近{{ recentOps.length }}条）</div>
      <div v-for="(op, i) in recentOps" :key="i" class="oplog-item">
        <span class="t">{{ op.t }}</span>
        <span>{{ op.text }}</span>
      </div>
    </div>

    <!-- 入口 -->
    <div class="entry-grid">
      <div class="entry" @click="$emit('go','status')">
        <span class="e-ico">📊</span><span class="e-label">状态</span>
        <span v-if="alertCount" class="e-badge">{{ alertCount }}</span>
      </div>
      <div class="entry" @click="$emit('go','inventory')">
        <span class="e-ico">🎒</span><span class="e-label">装备</span>
        <span v-if="itemCount" class="e-badge">{{ itemCount }}</span>
      </div>
      <div class="entry" @click="$emit('go','world')"><span class="e-ico">🗺️</span><span class="e-label">世界</span></div>
      <div class="entry" @click="$emit('go','camp')"><span class="e-ico">🏕️</span><span class="e-label">营地</span></div>
      <div class="entry" @click="$emit('go','workshop')"><span class="e-ico">🛠️</span><span class="e-label">工坊</span></div>
      <div class="entry" @click="$emit('go','journal')">
        <span class="e-ico">📖</span><span class="e-label">图鉴</span>
        <span v-if="journalCount" class="e-badge">{{ journalCount }}</span>
      </div>
    </div>

    <div class="term-card" @click="openGlossary('home')">
      <span class="tc-l"><span class="tc-ico">📖</span>这些数字是什么意思？</span>
      <span class="tc-arrow">查看术语说明 ›</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../../store';
import { openGlossary } from '../../glossary';
import InfoI from '../shared/InfoI.vue';
import VitalHero from './VitalHero.vue';

defineEmits<{ go: [tab: string] }>();
const store = useDataStore();
const d = computed<any>(() => store.data);

const 天数 = computed(() => d.value.世界?.时间?.天数 ?? 0);
const 时段 = computed(() => d.value.世界?.时间?.时段 ?? '清晨');
const 九尾状态 = computed(() => d.value.晓光?.狐类特性?.九尾状态 ?? '合并一尾');
const 灵力 = computed(() => d.value.晓光?.狐类特性?.灵力环境 ?? '稀薄');
const 执念状态 = computed(() => d.value.晓光?.执念?.状态 ?? '稳固');
const 健康 = computed(() => d.value.晓光?.生存状态?.健康 ?? 78);
const 饥饿 = computed(() => d.value.晓光?.生存状态?.饥饿 ?? 85);
const 口渴 = computed(() => d.value.晓光?.生存状态?.口渴 ?? 55);
const 精力 = computed(() => d.value.晓光?.生存状态?.精力 ?? 38);
const 体温 = computed(() => d.value.晓光?.生存状态?.体温 ?? 36.8);
const 精神 = computed(() => d.value.晓光?.生存状态?.精神 ?? 75);
const 精神区间 = computed(() => d.value.晓光?.$精神区间 ?? '稳定');
const 移速修正 = computed(() => d.value.$移动速度总修正 ?? 0);

const itemCount = computed(() => Object.keys(d.value.装备?.物品栏 ?? {}).length);
const journalCount = computed(() => {
  const j = d.value.图鉴 ?? {};
  return Object.keys(j.野兽 ?? {}).length + Object.keys(j.草药 ?? {}).length + Object.keys(j.足迹 ?? {}).length;
});
const recentOps = computed<{t: string; text: string}[]>(() => {
  const arr = d.value.$近期操作 ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.slice(-5).reverse();
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
  if (risk === '极高' || risk === '高') list.push({ ico: '⚠️', text: `失温风险${risk} — ${失温建议(d.value)}`, kind: 'danger' });
  else if (risk === '偏高') list.push({ ico: '⚠️', text: `失温风险偏高 — ${失温建议(d.value)}`, kind: 'warn' });

  if (口渴.value <= 30) list.push({ ico: '💧', text: `口渴${口渴.value}% — 严重缺水，需立即饮水`, kind: 'danger' });
  else if (口渴.value <= 50) list.push({ ico: '💧', text: `口渴${口渴.value}% — 该补水了`, kind: 'warn' });

  if (饥饿.value <= 25) list.push({ ico: '🍗', text: `饥饿${饥饿.value}% — 持续扣健康`, kind: 'danger' });
  if (健康.value <= 30) list.push({ ico: '❤️', text: `健康${健康.value}% — 危险`, kind: 'danger' });
  if (精神区间.value === '崩溃' || 精神区间.value === '临界') list.push({ ico: '🧠', text: `精神${精神区间.value} — 触发危机`, kind: 'danger' });

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
</script>

<style scoped>
.home { padding: 14px; animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.home-hero {
  background: linear-gradient(135deg, #fffdf9, #f6efe4);
  border: 1px solid var(--border); border-left: 4px solid var(--accent);
  border-radius: 8px; padding: 16px; margin-bottom: 14px;
  box-shadow: var(--shadow); position: relative; overflow: hidden;
}
.home-hero::after {
  content: '🦊'; position: absolute; right: -10px; bottom: -18px;
  font-size: 90px; opacity: .06; transform: rotate(-12deg);
}
.hero-top { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
.hero-name { font-family: var(--font-display); font-size: 22px; font-weight: 900; }
.hero-meta { font-size: 11px; color: var(--text-secondary); }
.hero-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0 12px; }
.tag {
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: var(--nav); color: var(--text-secondary);
  border: 1px solid rgba(140,126,108,.3);
}

.alert-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
.alert {
  display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500;
  padding: 8px 11px; border-radius: 6px; border: 1px solid;
}
.alert.danger { background: rgba(224,73,60,.08); border-color: rgba(224,73,60,.3); color: var(--danger); }
.alert.warn { background: rgba(226,143,27,.08); border-color: rgba(226,143,27,.3); color: #b06f12; }
.alert .a-ico { font-size: 15px; }

.vitals-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 12px; }

.sub-vitals { display: flex; gap: 8px; margin-bottom: 14px; }
.sv {
  flex: 1; background: var(--card-alt);
  border: 1px solid rgba(140,126,108,.2); border-radius: 6px;
  padding: 8px 10px; text-align: center;
}
.sv .v { font-family: var(--font-display); font-size: 18px; font-weight: 700; }
.sv .l {
  font-size: 9px; color: var(--text-secondary); margin-top: 2px;
  display: flex; align-items: center; justify-content: center; gap: 3px;
}

.today {
  background: var(--card); border: 1px dashed var(--border); border-radius: 7px;
  padding: 11px 13px; margin-bottom: 14px; font-size: 12px; line-height: 1.6;
  color: var(--text-secondary);
}
.today b { color: var(--accent); font-family: var(--font-display); }

.oplog {
  background: linear-gradient(135deg, #f3ece0, #fffdf9);
  border: 1px solid var(--border); border-radius: 7px;
  padding: 10px 12px; margin-bottom: 12px;
}
.oplog-h {
  font-size: 10px; color: var(--text-secondary); display: flex; align-items: center; gap: 5px;
  margin-bottom: 7px; letter-spacing: .3px;
}
.oplog-h .dot-live {
  width: 6px; height: 6px; border-radius: 50%; background: var(--success);
  box-shadow: 0 0 0 2px rgba(76,175,80,.2);
}
.oplog-item {
  font-size: 11px; line-height: 1.5; padding: 3px 0; display: flex; gap: 7px;
  color: var(--text-secondary);
}
.oplog-item .t {
  font-family: var(--font-data); font-size: 9px; color: var(--accent);
  flex-shrink: 0; padding-top: 1px;
}
.oplog-item:not(:last-child) { border-bottom: 1px dotted rgba(140,126,108,.2); }

.entry-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; }
.entry {
  background: var(--card); border: 1px solid var(--border); border-radius: 8px;
  padding: 14px 6px; text-align: center; cursor: pointer; transition: all .15s;
  box-shadow: var(--shadow-sm); position: relative;
}
.entry:hover { transform: translateY(-2px); box-shadow: var(--shadow); border-color: var(--accent-light); }
.entry .e-ico { font-size: 26px; display: block; line-height: 1; }
.entry .e-label { font-size: 11px; margin-top: 6px; font-weight: 500; }
.entry .e-badge {
  position: absolute; top: 6px; right: 6px; min-width: 16px; height: 16px;
  padding: 0 4px; border-radius: 8px; background: var(--accent); color: #fff;
  font-size: 9px; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
}

.term-card {
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(135deg, #f6efe4, #fffdf9);
  border: 1px solid var(--border); border-radius: 7px;
  padding: 11px 13px; margin: 18px 0 4px; cursor: pointer;
  box-shadow: var(--shadow-sm); transition: all .15s;
}
.term-card:hover { border-color: var(--accent-light); box-shadow: var(--shadow); }
.term-card .tc-l { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; }
.term-card .tc-l .tc-ico { font-size: 16px; }
.term-card .tc-arrow { font-size: 11px; color: var(--accent); }
</style>
