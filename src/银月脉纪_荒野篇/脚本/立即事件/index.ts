// 条件触发事件 — 使用 injectPrompts 注入关键字，触发世界书绿灯条目
$(async () => {
  await waitGlobalInitialized('Mvu');

  injectPrompts([
    {
      id: '精神危机',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【精神危机】】',
      filter: () => {
        const 执念状态 = _.get(getAllVariables(), 'stat_data.晓光.执念.状态');
        return 执念状态 === '崩溃';
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
        const 精神 = _.get(getAllVariables(), 'stat_data.晓光.生存状态.精神');
        const 上次铃铛 = _.get(getAllVariables(), 'stat_data.$上次铃铛结果') || '';
        return 精神 < 15 && 上次铃铛.includes('回响');
      },
      should_scan: true,
    },
  ]);
});
