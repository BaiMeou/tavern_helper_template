<template>
  <Teleport to="body">
    <div v-if="visible" class="gloss-overlay" @click.self="close">
      <div class="gloss-panel">
        <div class="gloss-head">
          <span class="gloss-title">{{ title }}</span>
          <button class="gloss-x" @click="close">✕</button>
        </div>
        <div class="gloss-body">
          <div v-for="t in items" :key="t.term" class="gloss-item">
            <div class="gloss-term"><span class="g-ico">{{ t.ico }}</span>{{ t.term }}</div>
            <div class="gloss-desc" v-html="t.desc" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { GLOSSARY, GLOSSARY_EVENT, GlossaryPayload } from '../../glossary';

const visible = ref(false);
const title = ref('术语说明');
const items = ref<{ term: string; ico: string; desc: string }[]>([]);

function open(payload: GlossaryPayload) {
  title.value = payload.title || '术语说明';
  items.value = payload.terms
    .map(t => GLOSSARY[t] ? { term: t, ico: GLOSSARY[t][0], desc: GLOSSARY[t][1] } : null)
    .filter(Boolean) as any;
  visible.value = true;
}
function close() { visible.value = false; }

function listener(e: any) { open(e.detail); }
onMounted(() => window.addEventListener(GLOSSARY_EVENT, listener));
onUnmounted(() => window.removeEventListener(GLOSSARY_EVENT, listener));
</script>

<style scoped>
.gloss-overlay {
  position: fixed; inset: 0; background: rgba(44,37,32,.55); backdrop-filter: blur(2px);
  display: flex; align-items: flex-end; justify-content: center; z-index: 9999;
  animation: fade .2s ease;
}
.gloss-panel {
  background: var(--bg); border: 1px solid var(--border); border-bottom: none;
  border-radius: 14px 14px 0 0; width: 100%; max-width: 640px; max-height: 78vh;
  display: flex; flex-direction: column;
  box-shadow: 0 -8px 30px rgba(44,37,32,.3);
  animation: slideUp .28s cubic-bezier(.2,.8,.3,1);
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
.gloss-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; position: relative;
}
.gloss-head::before {
  content: ''; position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
  width: 36px; height: 4px; border-radius: 2px; background: rgba(140,126,108,.4);
}
.gloss-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; }
.gloss-x {
  width: 28px; height: 28px; border: none; background: var(--nav);
  border-radius: 6px; font-size: 14px; cursor: pointer; color: var(--text-secondary);
}
.gloss-body { overflow-y: auto; padding: 12px 16px 24px; }
.gloss-item { padding: 11px 0; border-bottom: 1px dashed rgba(140,126,108,.3); }
.gloss-item:last-child { border-bottom: none; }
.gloss-term {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: bold; font-family: var(--font-display); color: var(--accent);
}
.gloss-term .g-ico { font-size: 15px; }
.gloss-desc { font-size: 12px; line-height: 1.65; color: var(--text-secondary); margin-top: 5px; }
.gloss-desc :deep(.hl) { color: var(--text); font-weight: 500; }
</style>
