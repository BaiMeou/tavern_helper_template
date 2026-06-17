<template>
  <div class="compass-wrap">
    <svg :width="size" :height="size" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="47" :fill="bg" :stroke="border" stroke-width="2.5" />
      <circle cx="50" cy="50" r="43" fill="none" :stroke="border" stroke-dasharray="3,3" stroke-width="0.8" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="rgba(140,126,108,0.15)" stroke-width="0.5" />
      <!-- Tick marks -->
      <line x1="50" y1="3" x2="50" y2="9" :stroke="border" stroke-width="2.5" />
      <line x1="50" y1="97" x2="50" y2="91" :stroke="border" stroke-width="1" />
      <line x1="3" y1="50" x2="9" y2="50" :stroke="border" stroke-width="1" />
      <line x1="97" y1="50" x2="91" y2="50" :stroke="border" stroke-width="1" />
      <line x1="17" y1="17" x2="21" y2="21" stroke="rgba(140,126,108,0.25)" stroke-width="0.8" />
      <line x1="83" y1="17" x2="79" y2="21" stroke="rgba(140,126,108,0.25)" stroke-width="0.8" />
      <line x1="17" y1="83" x2="21" y2="79" stroke="rgba(140,126,108,0.25)" stroke-width="0.8" />
      <line x1="83" y1="83" x2="79" y2="79" stroke="rgba(140,126,108,0.25)" stroke-width="0.8" />
      <!-- Needle -->
      <g :transform="`rotate(${needleRotation} 50 50)`">
        <polygon points="50,12 43,50 50,43" :fill="accentColor" :stroke="accentColor" stroke-width="1" />
        <polygon points="50,88 43,50 50,43" :fill="border" :stroke="border" stroke-width="0.8" />
        <polygon points="50,12 57,50 50,43" :fill="accentLight" :stroke="accentColor" stroke-width="1" />
        <polygon points="50,88 57,50 50,43" fill="rgba(140,126,108,0.5)" :stroke="border" stroke-width="0.8" />
      </g>
      <circle cx="50" cy="50" r="3.5" :fill="accentColor" />
      <text x="50" y="19" font-size="9" font-family="var(--font-display)" font-weight="bold" :fill="accentColor" text-anchor="middle">N</text>
      <text x="50" y="89" font-size="7" font-family="var(--font-display)" fill="var(--text-secondary)" text-anchor="middle">S</text>
      <text x="14" y="53" font-size="7" font-family="var(--font-display)" fill="var(--text-secondary)" text-anchor="middle">W</text>
      <text x="86" y="53" font-size="7" font-family="var(--font-display)" fill="var(--text-secondary)" text-anchor="middle">E</text>
    </svg>
    <div v-if="location" class="compass-location">📍 {{ location }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number;
    needleRotation?: number;
    location?: string;
    bg?: string;
    border?: string;
    accentColor?: string;
    accentLight?: string;
  }>(),
  {
    size: 160,
    needleRotation: 15,
    location: '',
    bg: '#F4EFEB',
    border: '#8C7E6C',
    accentColor: '#A84434',
    accentLight: '#C95A49',
  },
);
</script>

<style scoped>
.compass-wrap {
  text-align: center;
  margin-bottom: 14px;
}
.compass-wrap svg {
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.1));
}
.compass-location {
  font-size: 11px; color: var(--text-secondary); margin-top: 4px;
}
</style>
