// 条件触发事件 — 使用 injectPrompts 注入关键字，触发世界书绿灯条目
async function init() {
  await waitGlobalInitialized('Mvu');

  injectPrompts([
    {
      id: '精神危机',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【精神危机】】',
      filter: () => {
        try {
          const vars = getVariables({ type: 'message' });
          return _.get(vars, 'stat_data.晓光.执念.状态') === '崩溃';
        } catch { return false; }
      },
      should_scan: true,
    },
    {
      id: '铃铛奇迹',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【铃铛奇迹】】',
      filter: () => {
        try {
          const vars = getVariables({ type: 'message' });
          const 精神 = _.get(vars, 'stat_data.晓光.生存状态.精神', 100);
          const 上次铃铛 = _.get(vars, 'stat_data.$上次铃铛结果') || '';
          // 一次性守护：每次"回响奇迹"只在它发生后触发一次（靠掷骰清空$上次铃铛结果保证稀缺）
          return 精神 < 15 && 上次铃铛.includes('回响');
        } catch { return false; }
      },
      should_scan: true,
    },
  ]);
}

$(() => {
  errorCatched(init)();
});
