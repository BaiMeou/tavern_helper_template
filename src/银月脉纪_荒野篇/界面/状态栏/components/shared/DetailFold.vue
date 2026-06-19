<template>
  <div class="detail-fold" :class="{ open }">
    <div class="fold-head" @click="open = !open">
      <span class="fh-l">📊 <slot name="title">{{ title ?? '详细数据' }}</slot></span>
      <span class="fh-arr">▸</span>
    </div>
    <div class="fold-body" v-show="open">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
const open = ref(false);
</script>

<style scoped>
.detail-fold {
  margin-top: 6px; border: 1px solid rgba(140,126,108,.35);
  border-radius: 6px; overflow: hidden; background: var(--card);
}
.fold-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; cursor: pointer; font-size: 11px;
  color: var(--text-secondary); background: var(--card-alt); user-select: none;
  font-weight: 500;
}
.fold-head:hover { color: var(--accent); }
.fold-head .fh-l { display: flex; align-items: center; gap: 6px; }
.fold-head .fh-arr { transition: transform .2s; font-size: 10px; }
.detail-fold.open .fh-arr { transform: rotate(90deg); }
.fold-body {
  padding: 4px 12px 10px;
  animation: fade .2s ease;
}
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
</style>
