<template>
  <!-- 初始向导（仅未初始化时弹出） -->
  <SetupWizard v-if="!isSetupDone" @done="onSetupDone" />

  <!-- 主应用 -->
  <div v-else class="app">
    <ChoiceModal />
    <TopStatusBar />

    <!-- HOME 晨页 -->
    <main v-if="activeTab === 'home'" class="main-content">
      <HomeView @go="(t: string) => activeTab = t" />
    </main>

    <!-- 各类详情页（每页全屏专注） -->
    <main v-else class="main-content detail-mode">
      <DetailShell :title="currentTab.label" :icon="currentTab.icon" :sub="currentTab.sub" @back="activeTab = 'home'">
        <StatusGroup v-if="activeTab === 'status'" />
        <InventoryGroup v-else-if="activeTab === 'inventory'" />
        <WorldGroup v-else-if="activeTab === 'world'" />
        <CampGroup v-else-if="activeTab === 'camp'" />
        <WorkshopGroup v-else-if="activeTab === 'workshop'" />
        <JournalGroup v-else-if="activeTab === 'journal'" />
        <template #footer>
          <div class="term-card" @click="openGlossary(activeTab)">
            <span class="tc-l"><span class="tc-ico">📖</span>本页术语说明</span>
            <span class="tc-arrow">查看说明 ›</span>
          </div>
        </template>
      </DetailShell>
    </main>

    <!-- 术语悬浮窗 -->
    <GlossaryOverlay />
  </div>
</template>

<script setup lang="ts">
import SetupWizard from './components/setup/SetupWizard.vue';
import ChoiceModal from './components/shared/ChoiceModal.vue';
import TopStatusBar from './components/layout/TopStatusBar.vue';
import HomeView from './components/home/HomeView.vue';
import DetailShell from './components/layout/DetailShell.vue';
import StatusGroup from './components/status/StatusGroup.vue';
import InventoryGroup from './components/inventory/InventoryGroup.vue';
import WorldGroup from './components/world/WorldGroup.vue';
import CampGroup from './components/camp/CampGroup.vue';
import WorkshopGroup from './components/workshop/WorkshopGroup.vue';
import JournalGroup from './components/journal/JournalGroup.vue';
import GlossaryOverlay from './components/shared/GlossaryOverlay.vue';
import { openGlossary } from './glossary';
import { useDataStore } from './store';

const store = useDataStore();
// 初始化判定：根据存档内容推断（避免每次刷新都重弹向导清档）
// 1) 显式标记 $已初始化  2) 物品栏非空  3) 天数 > 0
const isSetupDone = computed(() => {
  const d: any = store.data;
  if (d?.$已初始化) return true;
  if (d?.装备?.物品栏 && Object.keys(d.装备.物品栏).length > 0) return true;
  if ((d?.世界?.时间?.天数 ?? 0) > 0) return true;
  return false;
});

function onSetupDone(_attrs: Record<string, number>, _selectedItemIds: string[]) {
  // SetupWizard 内部已写入 $已初始化，computed 自然变 true，无需额外处理
  toastr.success('准备好了！荒野求生——开始！');
}

const activeTab = useLocalStorage<string>('wilderness_journal:active_tab', 'home');

const tabs = [
  { id: 'home',      icon: '🏠', label: '首页', sub: '' },
  { id: 'status',    icon: '📊', label: '状态', sub: '体征 · 属性 · 身体状况' },
  { id: 'inventory', icon: '🎒', label: '装备', sub: '负重 · 物品 · 衣物' },
  { id: 'world',     icon: '🗺️', label: '世界', sub: '环境 · 天气 · 地标' },
  { id: 'camp',      icon: '🏕️', label: '营地', sub: '庇护 · 篝火 · 储水' },
  { id: 'workshop',  icon: '🛠️', label: '工坊', sub: '配方 · 陷阱 · 搜刮' },
  { id: 'journal',   icon: '📖', label: '图鉴', sub: '野兽 · 草药 · 日志' },
];
const currentTab = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0]);
</script>

<style lang="scss" scoped>
.app {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background:
    radial-gradient(circle at 20% 15%, rgba(168,68,52,.04), transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(140,126,108,.08), transparent 50%),
    var(--bg);
  background-image:
    radial-gradient(circle at 20% 15%, rgba(168,68,52,.04), transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(140,126,108,.08), transparent 50%),
    repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(140,126,108,.04) 28px, rgba(140,126,108,.04) 29px);
}
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  position: relative;
  &.detail-mode { padding: 0; }
}

/* 底部术语卡（详情页专用） */
.term-card {
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(135deg, #f6efe4, #fffdf9);
  border: 1px solid var(--border); border-radius: 7px;
  padding: 11px 13px; margin: 18px 14px 14px; cursor: pointer;
  box-shadow: var(--shadow-sm); transition: all .15s;
  &:hover { border-color: var(--accent-light); box-shadow: var(--shadow); }
  .tc-l { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; }
  .tc-l .tc-ico { font-size: 16px; }
  .tc-arrow { font-size: 11px; color: var(--accent); }
}
</style>
