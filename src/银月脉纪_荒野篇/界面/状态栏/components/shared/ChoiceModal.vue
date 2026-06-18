<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-card">
      <div class="modal-title">{{ choiceData.标题 || '发现物品' }}</div>
      <div class="modal-subtle" v-if="choiceData.多选">可多选 · 最多{{ choiceData.最大数量 || 99 }}件</div>

      <div class="choice-grid">
        <div v-for="opt in choiceData.选项" :key="opt.id"
          :class="['choice-card', { selected: selected.has(opt.id) }]"
          @click="toggleOpt(opt)">
          <span class="choice-icon">{{ opt.icon || '📦' }}</span>
          <div class="choice-body">
            <div class="choice-name">{{ opt.名称 }}</div>
            <div class="choice-desc">{{ opt.描述 || '' }}</div>
            <div class="choice-meta">
              <span v-if="opt.重量" class="chip">重量 {{ opt.重量 }}kg</span>
              <span v-if="opt.耐久度" class="chip">耐久 {{ opt.耐久度 }}%</span>
              <span v-if="opt.数量" class="chip">×{{ opt.数量 }}</span>
            </div>
          </div>
          <div v-if="selected.has(opt.id)" class="choice-check">✓</div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-btn cancel" @click="close">取消</button>
        <button class="modal-btn confirm" @click="confirm" :disabled="selected.size === 0">
          确认 ({{ selected.size }}件 · {{ totalPickWeight.toFixed(2) }}kg)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDataStore } from '../../store';

const store = useDataStore();
const visible = ref(false);
const choiceData = ref<any>({ 标题: '', 选项: [], 多选: false, 最大数量: 99 });
const selected = ref(new Set<string>());

const totalPickWeight = computed(() => {
  let w = 0;
  for (const opt of (choiceData.value.选项 || [])) {
    if (selected.value.has(opt.id)) w += opt.重量 || 0;
  }
  return w;
});

// Watch for AI-triggered choices
watch(() => _.get(store.data, '$前端选择'), (newVal: any) => {
  if (newVal && newVal.选项 && newVal.选项.length > 0) {
    choiceData.value = newVal;
    selected.value = new Set();
    visible.value = true;
  }
}, { deep: true });

function toggleOpt(opt: any) {
  if (selected.value.has(opt.id)) {
    selected.value.delete(opt.id);
  } else {
    if (!choiceData.value.多选) selected.value.clear();
    if (selected.value.size >= (choiceData.value.最大数量 || 99)) return;
    selected.value.add(opt.id);
  }
  selected.value = new Set(selected.value);
}

function confirm() {
  const picked = (choiceData.value.选项 || []).filter((o: any) => selected.value.has(o.id));
  // Write picked items to inventory
  const itemData: Record<string, any> = {};
  for (const opt of picked) {
    itemData[opt.id] = {
      名称: opt.名称, 分类: opt.分类 || '特殊', 重量: opt.重量 || 0,
      位置: '背包', 描述: opt.描述 || '',
      耐久度: opt.耐久度, 数量: opt.数量,
    };
  }
  // Write to store (syncs to AI)
  for (const [key, val] of Object.entries(itemData)) {
    _.set(store.data, `装备.物品栏.${key}`, val);
  }
  _.set(store.data, '$玩家选择', {
    已选: picked.map((o: any) => o.名称),
    时间: new Date().toISOString(),
  });
  _.set(store.data, '$前端操作', `玩家从${choiceData.value.标题}中选择了：${picked.map((o:any)=>o.名称).join('、')}`);
  // Clear trigger
  _.set(store.data, '$前端选择', null);
  visible.value = false;
}

function close() {
  _.set(store.data, '$前端选择', null);
  visible.value = false;
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(44,37,32,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-card { background: var(--bg); border: 3px double var(--border); border-radius: 8px; padding: 16px; max-width: 480px; width: 100%; max-height: 80vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
.modal-title { font-family: var(--font-display); font-size: 18px; font-weight: bold; color: var(--accent); margin-bottom: 4px; }
.modal-subtle { font-size: 11px; color: var(--text-secondary); margin-bottom: 10px; }
.choice-grid { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.choice-card { display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border); border-radius: 4px; cursor: pointer; background: var(--card); transition: all .15s; position: relative; }
.choice-card:hover { border-color: var(--accent-light); }
.choice-card.selected { border-color: var(--accent); background: rgba(168,68,52,0.04); }
.choice-icon { font-size: 24px; flex-shrink: 0; }
.choice-body { flex: 1; min-width: 0; }
.choice-name { font-weight: bold; font-size: 13px; }
.choice-desc { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.choice-meta { display: flex; gap: 4px; margin-top: 4px; }
.choice-check { position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
.modal-actions { display: flex; gap: 8px; }
.modal-btn { flex: 1; padding: 10px; border-radius: 4px; font-size: 13px; font-weight: bold; cursor: pointer; border: none; font-family: var(--font-body); }
.modal-btn.cancel { background: var(--nav); color: var(--text-secondary); }
.modal-btn.confirm { background: var(--accent); color: #fff; }
.modal-btn.confirm:disabled { opacity: 0.4; cursor: not-allowed; }
.chip { padding: 2px 6px; border-radius: 3px; font-size: 10px; background: var(--nav); color: var(--text-secondary); border: 1px solid var(--border); }
</style>
