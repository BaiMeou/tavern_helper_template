<template>
  <div class="detail-shell">
    <div class="detail-head">
      <button class="back-btn" @click="$emit('back')">‹</button>
      <span class="detail-title">{{ icon }} {{ title }}</span>
      <span v-if="sub" class="detail-sub">{{ sub }}</span>
    </div>
    <div class="detail-body">
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; icon: string; sub?: string }>();
defineEmits<{ back: [] }>();
</script>

<style scoped>
.detail-shell {
  padding: 14px;
  animation: fadeIn .25s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.detail-head {
  display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
  padding-bottom: 10px; border-bottom: 2px solid var(--border);
}
.back-btn {
  width: 34px; height: 34px; border-radius: 7px; border: 1px solid var(--border);
  background: var(--card); font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  color: var(--text);
}
.back-btn:hover { background: var(--nav); }
.detail-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; }
.detail-sub { font-size: 11px; color: var(--text-secondary); margin-left: auto; }
</style>
