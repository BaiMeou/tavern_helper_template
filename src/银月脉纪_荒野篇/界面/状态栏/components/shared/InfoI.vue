<template>
  <i class="info-i" @click.stop="openTerm(term)" :title="term">ⓘ</i>
</template>

<script setup lang="ts">
import { openTerm } from '../../glossary';
defineProps<{ term: string }>();
</script>

<style scoped>
.info-i {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--info); color: #fff; font-size: 9px; font-style: normal;
  font-weight: bold; cursor: pointer; vertical-align: middle; margin-left: 3px;
  flex-shrink: 0; transition: background .15s;
}
.info-i:hover { background: var(--accent); }
</style>
