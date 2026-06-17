<template>
  <!-- Setup Mode — first time -->
  <SetupWizard v-if="!isSetupDone" @done="onSetupDone" />

  <!-- Main App — after setup -->
  <div v-else class="app">
    <TopStatusBar />

    <div class="app-body">
      <nav class="side-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </nav>

      <main class="main-content">
        <StatusGroup v-if="activeTab === 'status'" />
        <InventoryGroup v-else-if="activeTab === 'inventory'" />
        <WorldGroup v-else-if="activeTab === 'world'" />
        <CampGroup v-else-if="activeTab === 'camp'" />
        <WorkshopGroup v-else-if="activeTab === 'workshop'" />
        <JournalGroup v-else-if="activeTab === 'journal'" />
      </main>
    </div>

    <nav class="bottom-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import SetupWizard from './components/setup/SetupWizard.vue';
import TopStatusBar from './components/layout/TopStatusBar.vue';
import StatusGroup from './components/status/StatusGroup.vue';
import InventoryGroup from './components/inventory/InventoryGroup.vue';
import WorldGroup from './components/world/WorldGroup.vue';
import CampGroup from './components/camp/CampGroup.vue';
import WorkshopGroup from './components/workshop/WorkshopGroup.vue';
import JournalGroup from './components/journal/JournalGroup.vue';

// Setup mode — check if player has completed initial setup
const isSetupDone = ref(
  _.has(getVariables({ type: 'message' }), 'stat_data') &&
  _.size(_.get(getVariables({ type: 'message' }), 'stat_data.装备.物品栏', {})) > 0,
);

function onSetupDone(attrs: Record<string, number>, selectedItemIds: string[]) {
  // Write initial attributes
  updateVariablesWith(vars => {
    for (const [key, val] of Object.entries(attrs)) {
      _.set(vars, `stat_data.晓光.基础属性.${key}`, val);
    }
  }, { type: 'message', message_id: getCurrentMessageId() });

  // Write selected items from the item pool
  // The setup wizard has the full item catalog embedded
  // We need to match selected IDs to full item data
  // For now, mark setup as done — items will be written by the wizard
  isSetupDone.value = true;
  toastr.success('准备好了！荒野求生——开始！');
}

const activeTab = useLocalStorage<string>('wilderness_journal:active_tab', 'status');

const tabs = [
  { id: 'status', icon: '📊', label: '状态' },
  { id: 'inventory', icon: '🎒', label: '装备' },
  { id: 'world', icon: '🗺️', label: '世界' },
  { id: 'camp', icon: '🏕️', label: '营地' },
  { id: 'workshop', icon: '🛠️', label: '工坊' },
  { id: 'journal', icon: '📖', label: '图鉴' },
];
</script>

<style lang="scss" scoped>
.app {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--bg);
}

.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.side-nav {
  display: none;
  flex-direction: column;
  gap: 1px;
  background: var(--nav);
  border-right: 2px solid var(--border);
  width: 68px;
  padding: 10px 2px;
  flex-shrink: 0;

  @media (min-width: 768px) {
    display: flex;
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 10px 2px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  transition: all 0.15s;
  border: 1px solid transparent;
  background: none;
  font-family: var(--font-body);

  .nav-icon {
    font-size: 20px;
    line-height: 1;
  }

  &.active {
    background: var(--bg);
    color: var(--accent);
    border-color: var(--border);
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}

.bottom-bar {
  display: flex;
  justify-content: space-around;
  background: var(--nav);
  border-top: 2px solid var(--border);
  flex-shrink: 0;

  @media (min-width: 768px) {
    display: none;
  }
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 7px 0;
  cursor: pointer;
  font-size: 10px;
  color: var(--text-secondary);
  border: none;
  background: none;
  font-family: var(--font-body);
  transition: all 0.15s;

  .tab-icon {
    font-size: 18px;
  }

  &.active {
    color: var(--accent);
    box-shadow: inset 0 -3px 0 var(--accent);
  }
}
</style>
