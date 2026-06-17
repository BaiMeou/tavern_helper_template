<template>
  <span :class="['badge', 'badge-' + kind]">
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{ kind: 'good' | 'warn' | 'bad' | 'info' | 'accent' }>();
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
}
.badge-good { background: rgba(76,175,80,.12); color: var(--success); }
.badge-warn { background: rgba(226,143,27,.12); color: var(--warning); }
.badge-bad { background: rgba(224,73,60,.1); color: var(--danger); }
.badge-info { background: rgba(52,138,167,.1); color: var(--info); }
.badge-accent { background: rgba(168,68,52,.08); color: var(--accent); }
</style>
