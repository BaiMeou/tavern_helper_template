<template>
  <div class="formula"><slot /></div>
</template>

<style scoped>
.formula {
  font-size: 10px; color: var(--text-secondary);
  background: rgba(140,126,108,.07); border-radius: 4px;
  padding: 5px 8px; margin-top: 6px;
  font-family: var(--font-data); line-height: 1.5;
}
.formula :deep(.op) { color: var(--accent); }
</style>
