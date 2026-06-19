<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="choice-modal-title">
        <div id="choice-modal-title" class="modal-title">{{ choiceData.标题 || '发现物品' }}</div>
        <div v-if="choiceData.多选" class="modal-subtle">
          可多选 · 最多{{ choiceData.最大数量 || 5 }}件 · 当前 {{ totalPickWeight.toFixed(1) }}kg
        </div>

        <div class="choice-grid">
          <div
            v-for="opt in choiceData.选项" :key="opt.id"
            :class="['choice-card', { selected: selected.has(opt.id), disabled: !selected.has(opt.id) && atLimit }]"
            role="button" tabindex="0"
            :aria-pressed="selected.has(opt.id)"
            :aria-disabled="!selected.has(opt.id) && atLimit"
            @click="toggleOpt(opt)"
            @keydown.enter.prevent="toggleOpt(opt)"
            @keydown.space.prevent="toggleOpt(opt)">
            <span class="choice-icon">{{ opt.icon || '📦' }}</span>
            <div class="choice-body">
              <div class="choice-name">
                {{ opt.名称 }}
                <span v-if="opt.损坏标签" class="cond-tag" :class="condClass(opt.损坏标签)">{{ opt.损坏标签 }}</span>
              </div>
              <div class="choice-desc">{{ opt.描述 || '' }}</div>
              <div class="choice-meta">
                <span v-if="opt.重量 != null" class="chip">重量 {{ opt.重量 }}kg</span>
                <span v-if="opt.耐久度 != null" class="chip">耐久 {{ opt.耐久度 }}%</span>
                <span v-if="opt.数量 != null" class="chip">×{{ opt.数量 }}</span>
                <span v-if="opt.易损度 != null" class="chip">易损{{ opt.易损度 }}</span>
                <span v-if="opt.可拆解" class="chip chip-warn">可拆解</span>
                <span v-if="opt.可修理" class="chip chip-info">可修理</span>
              </div>
            </div>
            <div v-if="selected.has(opt.id)" class="choice-check">✓</div>
            <div v-else-if="atLimit" class="choice-lock">满</div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="close">取消（什么都不捡）</button>
          <button class="modal-btn confirm" :disabled="selected.size === 0" @click="confirm">
            确认 ({{ selected.size }}件 · {{ totalPickWeight.toFixed(2) }}kg)
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useDataStore } from '../../store';

const store = useDataStore();
const visible = ref(false);
const choiceData = ref<any>({ 标题: '', 选项: [], 多选: false, 最大数量: 5 });
const selected = ref(new Set<string>());

const maxPick = computed(() => choiceData.value.最大数量 || 5);
const atLimit = computed(() => selected.value.size >= maxPick.value);

const totalPickWeight = computed(() => {
  let w = 0;
  for (const opt of (choiceData.value.选项 || [])) {
    if (selected.value.has(opt.id)) w += (opt.重量 || 0) * (opt.数量 || 1);
  }
  return w;
});

// AI 触发：watch $前端选择
watch(() => _.get(store.data, '$前端选择'), (newVal: any) => {
  if (newVal && Array.isArray(newVal.选项) && newVal.选项.length > 0) {
    choiceData.value = { 最大数量: 5, 多选: true, ...newVal };
    selected.value = new Set();
    visible.value = true;
  }
}, { deep: true });

// 键盘无障碍：弹窗可见时按 ESC 关闭（等价于「什么都不捡」）
function onKeydown(e: KeyboardEvent) {
  if (visible.value && e.key === 'Escape') {
    e.preventDefault();
    close();
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

function toggleOpt(opt: any) {
  if (selected.value.has(opt.id)) {
    selected.value.delete(opt.id);
    selected.value = new Set(selected.value);
  } else {
    if (!choiceData.value.多选) selected.value.clear();
    if (atLimit.value) return;
    selected.value.add(opt.id);
    selected.value = new Set(selected.value);
  }
}

function condClass(label: string) {
  if (label === '完好') return 'cond-good';
  if (label === '少耐久') return 'cond-warn';
  if (label === '部分损坏') return 'cond-bad';
  return 'cond-bad';
}

// 字段透传白名单：弹窗能落库的所有物品字段
const FIELD_WHITELIST = ['名称','分类','重量','位置','描述','耐久度','数量','容量','当前容量',
  '保质期天','锋利度','电量','使用次数剩余','保暖值','防风值','防水性','湿度','破损度',
  '燃烧时长分钟','结构强度','材料类型','易损度','损坏标签','可修理','可拆解'];

// 损坏物品处理规则（与世界书《前端交互系统》损坏物品文档对照的单一真源）
const DAMAGED_RULES: Record<string, any> = { 耐久度: 0, 可拆解: true };

function confirm() {
  const picked = (choiceData.value.选项 || []).filter((o: any) => selected.value.has(o.id));
  for (const opt of picked) {
    const entry: any = { 位置: opt.位置 || '背包' };
    for (const k of FIELD_WHITELIST) {
      if (opt[k] !== undefined && opt[k] !== null) entry[k] = opt[k];
    }
    if (!entry.分类) entry.分类 = '特殊';
    if (entry.损坏标签 === '损坏') {
      // 损坏物品按统一规则处理（耐久归零、标记可拆解）
      Object.assign(entry, DAMAGED_RULES);
    }
    _.set(store.data, `装备.物品栏.${opt.id}`, entry);
  }
  const 摘要 = picked.map((o: any) => {
    let s = o.名称;
    if (o.损坏标签 && o.损坏标签 !== '完好') s += `(${o.损坏标签})`;
    return s;
  }).join('、');
  _.set(store.data, '$玩家选择', {
    已选: picked.map((o: any) => ({ id: o.id, 名称: o.名称, 损坏标签: o.损坏标签 || '完好' })),
    时间: nowLabel(),
  });
  // 追加到 AI 操作记忆（环形5条）
  const ops = _.get(store.data, '$近期操作', []) as any[];
  ops.push({ t: nowLabel(), text: `从「${choiceData.value.标题}」中拾取：${摘要}（+${totalPickWeight.value.toFixed(1)}kg）` });
  while (ops.length > 5) ops.shift();
  _.set(store.data, '$近期操作', ops);
  _.set(store.data, '$前端操作', `玩家从「${choiceData.value.标题}」中拾取了：${摘要}（${picked.length}件·${totalPickWeight.value.toFixed(1)}kg）`);
  _.set(store.data, '$前端选择', null);
  visible.value = false;
}

function nowLabel(): string {
  const d = (store.data as any)?.世界?.时间;
  if (!d) return '现在';
  return `第${d.天数 ?? 0}天 ${d.时段 ?? ''}`;
}

function close() {
  visible.value = false;
  // 取消=什么都不捡，也要告知 AI
  const ops = _.get(store.data, '$近期操作', []) as any[];
  ops.push({ t: nowLabel(), text: `放弃了「${choiceData.value.标题}」的拾取机会` });
  while (ops.length > 5) ops.shift();
  _.set(store.data, '$近期操作', ops);
  _.set(store.data, '$前端操作', `玩家放弃了「${choiceData.value.标题}」中的所有物品（什么都没捡）`);
  _.set(store.data, '$前端选择', null);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(44,37,32,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 16px;
  animation: fade .2s ease;
}
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
.modal-card {
  background: var(--bg); border: 3px double var(--border); border-radius: 8px;
  padding: 16px; max-width: 480px; width: 100%; max-height: 80vh; overflow-y: auto;
  box-shadow: var(--shadow-lg); animation: slide .25s cubic-bezier(.2,.8,.3,1);
}
@keyframes slide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-title { font-family: var(--font-display); font-size: 18px; font-weight: bold; color: var(--accent); margin-bottom: 4px; }
.modal-subtle { font-size: 11px; color: var(--text-secondary); margin-bottom: 10px; }
.choice-grid { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.choice-card {
  display: flex; align-items: center; gap: 8px; padding: 10px;
  border: 2px solid var(--border); border-radius: 4px; cursor: pointer;
  background: var(--card); transition: all .15s; position: relative;
}
.choice-card:hover { border-color: var(--accent-light); }
.choice-card.selected { border-color: var(--accent); background: rgba(168,68,52,0.04); }
.choice-card.disabled { opacity: .5; cursor: not-allowed; }
.choice-icon { font-size: 24px; flex-shrink: 0; }
.choice-body { flex: 1; min-width: 0; }
.choice-name { font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.choice-desc { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.choice-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.cond-tag { font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: bold; }
.cond-good { background: rgba(76,175,80,.15); color: var(--success); }
.cond-warn { background: rgba(226,143,27,.15); color: #b06f12; }
.cond-bad { background: rgba(224,73,60,.13); color: var(--danger); }
.chip { padding: 2px 6px; border-radius: 3px; font-size: 10px; background: var(--nav); color: var(--text-secondary); border: 1px solid var(--border); }
.chip-warn { background: rgba(226,143,27,.12); color: #b06f12; }
.chip-info { background: rgba(52,138,167,.1); color: var(--info); }
.choice-check {
  position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); color: #fff; font-size: 14px; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
}
.choice-lock {
  position: absolute; top: 8px; right: 8px; font-size: 10px; color: var(--text-secondary);
  background: var(--nav); padding: 2px 6px; border-radius: 3px;
}
.modal-actions { display: flex; gap: 8px; }
.modal-btn { flex: 1; padding: 10px; border-radius: 4px; font-size: 13px; font-weight: bold; cursor: pointer; border: none; font-family: var(--font-body); }
.modal-btn.cancel { background: var(--nav); color: var(--text-secondary); }
.modal-btn.confirm { background: var(--accent); color: #fff; }
.modal-btn.confirm:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
