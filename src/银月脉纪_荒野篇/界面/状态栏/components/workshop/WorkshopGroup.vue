<template>
  <div class="panel">
    <div class="card card-accent" style="font-size: 12px">
      <span style="font-size: 20px">🧠</span> <strong>智力 LV.{{ intellect }}</strong>
      <template v-if="thinkAccel"> — 思维加速可用<InfoI term="思维加速" /></template>
      <div class="subtle">晓光能在脑海中推演物品制作方法。发现材料或尝试制作时自动解锁配方。</div>
    </div>

    <!-- 配方科技树 -->
    <div class="sec-hdr">🌳 配方科技树</div>
    <div class="tech-tree">
      <div v-for="(r, key) in recipes" :key="key" :class="['tech-node', techNodeState(r)]">
        <div class="tech-node-icon">{{ recipeIcon(key) }}</div>
        <span class="tech-node-name">{{ key }}</span>
        <span class="tech-node-req">{{ techNodeReq(r) }}</span>
      </div>
    </div>

    <!-- 可制作配方 -->
    <div class="sec-hdr">
      📖 可制作配方 <span class="sub">{{ recipeCount }} 个已掌握</span>
    </div>
    <div v-if="recipeCount === 0" class="empty-state">
      尚未掌握任何配方<br />在荒野中发现材料或尝试制作后会逐渐摸索出新方法
    </div>
    <div v-for="(r, key) in craftableRecipes" :key="key" class="recipe-card">
      <div class="recipe-head">
        <span class="recipe-name">{{ recipeIcon(key) }} {{ key }}</span>
        <span :class="['badge', r.已解锁 ? (canCraft(r) ? 'badge-good' : 'badge-warn') : 'badge-bad']">
          {{ !r.已解锁 ? '未解锁' : canCraft(r) ? '可制作' : '缺材料' }}
        </span>
      </div>
      <div class="recipe-mats">
        材料：
        <span v-for="(amt, mat) in r.所需材料" :key="mat" :class="['mat', haveMaterial(mat, amt) ? 'have' : 'miss']">
          {{ mat }} ×{{ amt }} {{ haveMaterial(mat, amt) ? '✓' : '✗' }}
        </span>
      </div>
      <div class="recipe-effect">{{ r.效果描述 }}</div>
      <div class="op-line">
        <span style="font-size: 10px; color: var(--text-secondary)"
          >耗时{{ r.制作耗时分钟 }}min · 需智力{{ r.所需智力 || 0 }} · 🛠️ {{ r.所需工具 || '徒手' }}</span
        >
        <button v-if="r.已解锁" class="op-btn" :disabled="!canCraft(r)" @click="craft(String(key))">🔨 制作</button>
      </div>
    </div>
    <div class="hint-card">
      💡 想让晓光制作某样东西？直接在对话里说"用XX材料做YY"——晓光会按配方动手，材料消耗与产物由剧情自然推进。
    </div>

    <!-- 陷阱网络 -->
    <div class="sec-hdr">🪤 陷阱网络 <span class="sub">可结算</span></div>
    <div v-if="Object.keys(traps).length === 0" class="empty-state">尚未布置任何陷阱</div>
    <div v-for="(t, key) in traps" :key="key" class="trap-card">
      <div class="trap-ico">{{ trapIcon(t.类型) }}</div>
      <div class="trap-body">
        <div class="trap-name">{{ key }}</div>
        <div class="trap-meta">
          {{ t.位置 }} · {{ t.类型 }} · <span :class="['badge', trapBadge(t.状态)]">{{ t.状态 }}</span
          ><template v-if="t.布置天数 != null"> · {{ t.布置天数 }}天</template>
        </div>
        <div v-if="t.捕获物" class="trap-meta" style="color: var(--success)">捕获：{{ t.捕获物 }}</div>
      </div>
      <div class="trap-ops">
        <button v-if="t.状态 === '待机'" class="op-btn ghost" @click="trapAction('结算', `结算陷阱${key}`)">
          结算
        </button>
        <button
          v-if="t.状态 === '已触发' || t.状态 === '捕获成功' || t.状态 === '捕获逃脱' || t.状态 === '已损坏'"
          class="op-btn ghost"
          @click="trapAction('重置', `重置陷阱${key}`)"
        >
          重置
        </button>
      </div>
    </div>

    <!-- 搜刮探索 -->
    <div class="sec-hdr">🔍 搜刮探索</div>
    <button class="roll-btn" @click="scavenge">🎲 搜刮当前区域（感知检定）</button>
    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px; line-height: 1.6">
      到了<b>遗迹、物资点、坠机残骸</b>等物品密集的地点，晓光会自动留意可拾取的东西，并弹窗让你挑捡。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Schema } from '../../../../schema';
import { useDataStore } from '../../store';
import InfoI from '../shared/InfoI.vue';

const store = useDataStore();
const d = computed<Schema>(() => store.data);

const intellect = computed(() => d.value.晓光?.基础属性?.智力 ?? 8);
const thinkAccel = computed(() => d.value.晓光?.$思维加速可用 ?? false);
const recipes = computed(() => d.value.工坊?.配方 ?? {});
const recipeCount = computed(() => Object.keys(recipes.value).filter(k => recipes.value[k].已解锁).length);
const traps = computed(() => d.value.工坊?.陷阱 ?? {});
const 物品栏 = computed(() => d.value.装备?.物品栏 ?? {});

function trapBadge(s: string) {
  if (s === '捕获成功') return 'badge-good';
  if (s === '待机') return 'badge-info';
  if (s === '已损坏') return 'badge-bad';
  return 'badge-warn';
}

// ── v4 新增：科技树状态 ──
function techNodeState(r: any): string {
  if (!r.已解锁) return r.所需智力 && r.所需智力 > intellect.value ? 'locked' : 'available';
  return 'unlocked';
}
function techNodeReq(r: any): string {
  if (!r.已解锁) return r.所需智力 && r.所需智力 > intellect.value ? `需智力≥${r.所需智力}` : '可制作';
  return '✓ 已解锁';
}

// ── v4 新增：配方图标 ──
function recipeIcon(name: string): string {
  const map: Record<string, string> = {
    生火: '🔥',
    绳索: '🪢',
    绳索陷阱: '🪤',
    简易钓钩: '🐟',
    弓箭: '🏹',
    皮甲: '🛡️',
    矛: '⚔️',
    容器: '🫗',
  };
  for (const k of Object.keys(map)) {
    if (name.includes(k)) return map[k];
  }
  return '🔨';
}

// ── v4 新增：材料检查 ──
function haveMaterial(mat: string, need: number): boolean {
  // 在物品栏中查找名称包含 mat 的物品，累加数量
  let have = 0;
  for (const item of Object.values(物品栏.value) as any[]) {
    if ((item.名称 || '').includes(mat) || (item.材料类型 || '').includes(mat)) {
      have += item.数量 ?? 1;
    }
  }
  return have >= need;
}
function canCraft(r: any): boolean {
  if (!r.已解锁) return false;
  if (r.所需智力 && r.所需智力 > intellect.value) return false;
  const mats = r.所需材料 ?? {};
  return Object.entries(mats).every(([mat, amt]) => haveMaterial(mat, amt as number));
}

// ── v4 新增：可制作配方（已解锁的）──
const craftableRecipes = computed(() => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(recipes.value)) {
    if ((v as any).已解锁) out[k] = v;
  }
  return out;
});

// ── v4 新增：制作 ──
function craft(name: string) {
  _.set(store.data, '$前端操作', `玩家制作${name}`);
  toastr.info(`🔨 开始制作 ${name}`);
}

// ── v4 新增：陷阱操作 ──
function trapAction(action: string, desc: string) {
  _.set(store.data, '$前端操作', desc);
  toastr.info(`${action}：${desc}`);
}

// ── v4 新增：搜刮 ──
function scavenge() {
  _.set(store.data, '$前端操作', '玩家搜刮探索');
  toastr.info('🎲 搜刮当前区域…');
}

// ── v4 新增：陷阱图标 ──
function trapIcon(type: string): string {
  const map: Record<string, string> = {
    绳索陷阱: '🪢',
    落穴陷阱: '🕳️',
    网陷阱: '🕸️',
    简易钓钩: '🎣',
    藤蔓陷阱: '🌿',
  };
  return map[type] || '🪤';
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
.subtle {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 3px;
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

/* 科技树 */
.tech-tree {
  background: rgba(140, 126, 108, 0.04);
  border: 1px solid rgba(140, 126, 108, 0.15);
  border-radius: var(--r-md);
  padding: 14px;
  margin-bottom: 12px;
}
.tech-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 11px;
  position: relative;
}
.tech-node::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: -8px;
  width: 2px;
  background: rgba(140, 126, 108, 0.2);
}
.tech-node:last-child::before {
  display: none;
}
.tech-node-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  z-index: 1;
}
.tech-node.unlocked .tech-node-icon {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}
.tech-node.available .tech-node-icon {
  background: rgba(168, 68, 52, 0.1);
  color: var(--accent);
}
.tech-node.locked .tech-node-icon {
  background: rgba(140, 126, 108, 0.1);
  color: var(--text-secondary);
}
.tech-node-name {
  font-weight: 600;
}
.tech-node.unlocked .tech-node-name {
  color: var(--success);
}
.tech-node.locked .tech-node-name {
  color: var(--text-secondary);
  opacity: 0.6;
}
.tech-node-req {
  margin-left: auto;
  font-size: 9px;
  color: var(--text-secondary);
}

/* 配方卡 */
.recipe-card {
  background: var(--card);
  border: 1px solid rgba(140, 126, 108, 0.18);
  border-radius: var(--r-md);
  padding: 13px 15px;
  margin-bottom: 8px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s var(--ease-out);
}
.recipe-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.recipe-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.recipe-name {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
}
.recipe-mats {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 6px;
}
.recipe-mats .mat {
  display: inline-block;
  padding: 2px 7px;
  background: rgba(140, 126, 108, 0.08);
  border-radius: var(--r-pill);
  margin: 2px 3px 2px 0;
  border: 1px solid rgba(140, 126, 108, 0.12);
}
.recipe-mats .mat.have {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success);
  border-color: rgba(76, 175, 80, 0.2);
}
.recipe-mats .mat.miss {
  background: rgba(224, 73, 60, 0.08);
  color: var(--danger);
  border-color: rgba(224, 73, 60, 0.2);
  text-decoration: line-through;
  opacity: 0.7;
}
.recipe-effect {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  line-height: 1.4;
}

.hint-card {
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-secondary);
  background: rgba(52, 138, 167, 0.06);
  border: 1px dashed rgba(52, 138, 167, 0.25);
  border-radius: 6px;
  padding: 9px 11px;
  margin-bottom: 12px;
}

/* 陷阱卡 */
.trap-card {
  background: var(--card);
  border: 1px solid rgba(140, 126, 108, 0.18);
  border-radius: var(--r-md);
  padding: 11px 13px;
  margin-bottom: 8px;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}
.trap-card:hover {
  transform: translateX(2px);
  box-shadow: var(--shadow);
}
.trap-ico {
  font-size: 24px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(140, 126, 108, 0.06);
  border-radius: var(--r-sm);
}
.trap-body {
  flex: 1;
}
.trap-name {
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-display);
}
.trap-meta {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.trap-ops {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 按钮 */
.op-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
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
.op-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
.roll-btn {
  width: 100%;
  padding: 14px;
  border-radius: var(--r-md);
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(168, 68, 52, 0.3);
  transition: all 0.2s var(--ease-out);
  font-family: var(--font-body);
}
.roll-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(168, 68, 52, 0.4);
}
.roll-btn:active {
  transform: translateY(-1px);
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
.card-accent {
  border-left: 4px solid var(--accent);
}
</style>
