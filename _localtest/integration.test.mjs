// 集成测试：模拟"前端写变量 → mvu 同步 → AI 读到"全链路
// 回答用户核心疑问：前端 store.data 改动到底会不会进 message 变量、被 AI 读到
import assert from 'assert';
import _ from 'lodash';
import { reactive, watch, nextTick } from 'vue';

let pass = 0, fail = 0;
const T = async (name, fn) => { try { await fn(); console.log('  ✅', name); pass++; } catch (e) { console.log('  ❌', name, '\n     ', e.message); fail++; } };

console.log('\n[集成测试: 前端写变量 → 同步 → AI 可读]');

// ── 内存变量库：模拟酒馆某楼层的变量存储 ──
function makeVarStore(initialStatData = {}) {
  const store = { stat_data: _.cloneDeep(initialStatData) };
  return {
    getVariables: () => _.cloneDeep(store),               // AI/前端读
    updateVariablesWith: (fn) => { fn(store); return store; }, // 写
    raw: store,
  };
}

// ── 简化版 mvu store：复刻 util/mvu.ts 的 watchIgnorable 同步核心 ──
// （真实 store 还有 2s 轮询，这里只验证"前端改 data → 写回变量"这条关键链）
function makeMvuStore(schema, varStore) {
  const data = reactive(schema.parse(_.get(varStore.getVariables(), 'stat_data', {})));
  let ignoring = false;
  watch(data, (nv) => {
    if (ignoring) return;
    const result = schema.safeParse(_.cloneDeep(nv));
    if (result.error) return;
    varStore.updateVariablesWith(v => _.set(v, 'stat_data', result.data));
  }, { deep: true });
  return { data };
}

// 用最小 schema（避免依赖 ts import；本测试聚焦同步机制而非业务 schema）
const { z } = await import('zod');
const MiniSchema = z.object({
  晓光: z.object({ 基础属性: z.object({ 体质: z.coerce.number().prefault(2) }).prefault({}) }).prefault({}),
  装备: z.object({
    物品栏: z.record(z.string(), z.any()).prefault({}),
    负重: z.object({ 安全上限: z.coerce.number().prefault(9) }).prefault({}),
  }).prefault({}),
  $前端操作: z.string().prefault(''),
  $已初始化: z.boolean().prefault(false),
}).passthrough();

// ── 1. 前端改 store.data → 写回 message 变量 ──
await T('前端改 store.data.装备.物品栏 → 进 message 变量', async () => {
  const vs = makeVarStore({});
  const store = makeMvuStore(MiniSchema, vs);
  // 模拟 ChoiceModal: _.set(store.data, '装备.物品栏.斧头', {...})
  _.set(store.data, '装备.物品栏.斧头', { 名称: '斧头', 分类: '工具', 重量: 1.5, 位置: '背包', 描述: '从残骸捡的' });
  await nextTick();
  // AI 这一刻读 message 变量
  const aiSees = vs.getVariables();
  assert(aiSees.stat_data.装备.物品栏.斧头, 'AI 应能读到前端写入的斧头');
  assert.strictEqual(aiSees.stat_data.装备.物品栏.斧头.名称, '斧头');
});

// ── 2. 前端写 $前端操作 → AI 读到意图 ──
await T('前端写 $前端操作 → AI 读到玩家意图', async () => {
  const vs = makeVarStore({});
  const store = makeMvuStore(MiniSchema, vs);
  _.set(store.data, '$前端操作', '玩家尝试生火');
  await nextTick();
  assert.strictEqual(vs.getVariables().stat_data.$前端操作, '玩家尝试生火', 'AI 应读到操作意图');
});

// ── 3. SetupWizard 正确写法（store.data）vs 异类写法对比 ──
await T('SetupWizard 用 store.data 写法 → 同步生效', async () => {
  const vs = makeVarStore({});
  const store = makeMvuStore(MiniSchema, vs);
  // 正确写法（本次要改成的）：直接改 store.data，无 stat_data 前缀
  _.set(store.data, '$已初始化', true);
  _.set(store.data, '装备.物品栏.猎刀', { 名称: '猎刀', 分类: '武器', 重量: 0.3, 位置: '腰挂', 描述: '' });
  await nextTick();
  const seen = vs.getVariables().stat_data;
  assert.strictEqual(seen.$已初始化, true, '$已初始化应同步');
  assert(seen.装备.物品栏.猎刀, '物品应同步');
});

// ── 4. 异类写法陷阱：写到 stat_data.xxx（多前缀）会埋错位置 ──
await T('异类写法演示：多 stat_data 前缀 → 数据错位', async () => {
  const vs = makeVarStore({});
  const store = makeMvuStore(MiniSchema, vs);
  // 错误写法：_.set(store.data, 'stat_data.装备...') —— store.data 本身就是 stat_data
  _.set(store.data, 'stat_data.装备.物品栏.错位刀', { 名称: '错位刀' });
  await nextTick();
  const seen = vs.getVariables().stat_data;
  // 正确路径下读不到（被埋到 stat_data.stat_data.装备 里了）
  assert(!seen.装备?.物品栏?.错位刀, '多前缀会导致 AI 在正确路径读不到');
  assert(seen.stat_data?.装备?.物品栏?.错位刀, '实际被埋到了 stat_data.stat_data 下（这就是 bug）');
});

// ── 5. 复刻修复后的 SetupWizard.confirm 写入序列：全部 store.data、无前缀 ──
await T('SetupWizard(修复后)：属性/物品/安全上限 全部正确路径同步', async () => {
  const vs = makeVarStore({});
  const store = makeMvuStore(MiniSchema, vs);
  // 复刻 confirm() 现在的写法
  _.set(store.data, '$已初始化', true);
  const attrs = { 体质: 5, 敏捷: 2, 智力: 8, 意志: 4, 感知: 4 };
  for (const [k, v] of Object.entries(attrs)) _.set(store.data, `晓光.基础属性.${k}`, v);
  _.set(store.data, '装备.物品栏.斧头', { 名称: '斧头', 分类: '工具', 重量: 1.5, 位置: '背包', 描述: '' });
  _.set(store.data, '装备.负重.安全上限', 9.7);
  await nextTick();
  const seen = vs.getVariables().stat_data;
  assert.strictEqual(seen.$已初始化, true, '$已初始化应同步');
  assert.strictEqual(seen.晓光.基础属性.体质, 5, '体质应同步到正确路径');
  assert(seen.装备.物品栏.斧头, '物品应同步');
  assert.strictEqual(seen.装备.负重.安全上限, 9.7, '安全上限应同步');
  // 关键：不应出现 stat_data.stat_data 错位
  assert(!seen.stat_data, '不应有 stat_data.stat_data 错位嵌套');
});

console.log(`\n集成: ${pass} 通过, ${fail} 失败\n`);
process.exitCode = fail ? 1 : 0;
