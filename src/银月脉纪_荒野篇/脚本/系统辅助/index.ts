// ═══════════════════════════════════════════════════════════════
// 系统辅助脚本 — XP自动升级 + 掷骰广播 + 自然衰减(可选)
// ═══════════════════════════════════════════════════════════════

$(async () => {
  await waitGlobalInitialized('Mvu');

  // ─── XP自动升级 ───
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, variables => {
    const 属性列表 = [
      { xpKey: '体质XP', attrPath: '基础属性.体质' },
      { xpKey: '敏捷XP', attrPath: '基础属性.敏捷' },
      { xpKey: '意志XP', attrPath: '基础属性.意志' },
      { xpKey: '感知XP', attrPath: '基础属性.感知' },
    ];

    for (const { xpKey, attrPath } of 属性列表) {
      const xp = _.get(variables, `stat_data.晓光.属性成长.${xpKey}`, 0);
      if (xp >= 100) {
        const currentLevel = _.get(variables, `stat_data.晓光.${attrPath}`, 1);
        const newLevel = Math.min(currentLevel + 1, 20);
        const overflowXp = xp - 100;

        _.set(variables, `stat_data.晓光.${attrPath}`, newLevel);
        _.set(variables, `stat_data.晓光.属性成长.${xpKey}`, overflowXp);

        toastr.success(
          `${xpKey.replace('XP', '')} 升级！${currentLevel} → ${newLevel}`,
        );
        console.info(
          `[系统辅助] ${xpKey.replace('XP', '')}升级: ${currentLevel}→${newLevel}, XP溢出: ${overflowXp}`,
        );
      }
    }
  });

  // ─── 掷骰广播 ───
  // 注册为全局工具函数，供世界书条件事件引用
  // AI通过JSON Patch中的关键字触发掷骰
  // 将掷骰结果以定性描述写入变量，AI据此叙事
  eventOn(Mvu.events.COMMAND_PARSED, commands => {
    for (const command of commands) {
      const args = command.args || [];

      // 搜刮掷骰
      if (command.type === 'scavenge_roll') {
        const 感知 = _.get(
          getVariables({ type: 'message', message_id: getCurrentMessageId() }),
          'stat_data.晓光.基础属性.感知',
          4,
        );
        const baseRoll = Math.random();
        const perceptionBonus = (感知 - 1) / 40; // 感知1-20 → 0 到 0.475 加成
        const finalRoll = baseRoll + perceptionBonus;

        let quality: string;
        if (finalRoll > 0.85) quality = '丰盛——意外发现了有价值的物品';
        else if (finalRoll > 0.6) quality = '良好——找到了几样有用的东西';
        else if (finalRoll > 0.35) quality = '一般——只找到些基础物资';
        else if (finalRoll > 0.15) quality = '稀少——勉强找到点能用的';
        else quality = '几乎一无所获——这片区域已被搜刮干净';

        // 将结果注入变量供AI读取
        const variables = Mvu.getMvuData({
          type: 'message',
          message_id: getCurrentMessageId(),
        });
        _.set(variables, 'stat_data.$上次搜刮结果', quality);
        Mvu.replaceMvuData(variables, {
          type: 'message',
          message_id: getCurrentMessageId(),
        });
      }

      // 狩猎掷骰
      if (command.type === 'hunt_roll') {
        const 敏捷 = _.get(
          getVariables({ type: 'message', message_id: getCurrentMessageId() }),
          'stat_data.晓光.基础属性.敏捷',
          2,
        );
        const 感知 = _.get(
          getVariables({ type: 'message', message_id: getCurrentMessageId() }),
          'stat_data.晓光.基础属性.感知',
          4,
        );
        const baseRoll = Math.random();
        const agiBonus = (敏捷 - 1) / 60;
        const perBonus = (感知 - 1) / 80;
        const finalRoll = baseRoll + agiBonus + perBonus;

        let result: string;
        if (finalRoll > 0.85) result = '大获成功——捕获了猎物！';
        else if (finalRoll > 0.6) result = '有所收获——抓住了小型猎物';
        else if (finalRoll > 0.35) result = '勉强成功——只抓到些小东西';
        else if (finalRoll > 0.15) result = '失手了——猎物逃走了';
        else result = '毫无收获——今天运气不佳';

        const variables = Mvu.getMvuData({
          type: 'message',
          message_id: getCurrentMessageId(),
        });
        _.set(variables, 'stat_data.$上次狩猎结果', result);
        Mvu.replaceMvuData(variables, {
          type: 'message',
          message_id: getCurrentMessageId(),
        });
      }

      // 铃铛掷骰 (叙事用 — 不是刚性机制，但提供随机性)
      if (command.type === 'bell_roll') {
        const roll = Math.floor(Math.random() * 6) + 1; // d6
        const 灵力环境 = _.get(
          getVariables({ type: 'message', message_id: getCurrentMessageId() }),
          'stat_data.晓光.狐类特性.灵力环境',
          '稀薄',
        );
        const 灵力修正 = 灵力环境 === '稀薄' ? -2 : 灵力环境 === '正常' ? 0 : 2;
        const adjustedRoll = Math.max(1, roll + 灵力修正);

        let bellResult: string;
        if (adjustedRoll >= 5) bellResult = '铃铛发出了一声清脆的回响——在这一刻，她仿佛听到了主人的声音';
        else if (adjustedRoll >= 3) bellResult = '铃铛轻响了一声——微弱，但确实响了';
        else bellResult = '铃铛无声——和之前几次一样，森林依旧沉默';

        const variables = Mvu.getMvuData({
          type: 'message',
          message_id: getCurrentMessageId(),
        });
        _.set(variables, 'stat_data.$上次铃铛结果', bellResult);
        _.set(variables, 'stat_data.$铃铛掷骰值', adjustedRoll);
        Mvu.replaceMvuData(variables, {
          type: 'message',
          message_id: getCurrentMessageId(),
        });
      }
    }
  });

  // ─── 可选：自然衰减（每小时自动下降生存状态） ───
  // 当前版本由AI在世界书规则中自行判断——更自然，不机械化
  // 如需启用硬性衰减，取消下面的注释：
  //
  // useIntervalFn(() => {
  //   const variables = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
  //   const hunger = _.get(variables, 'stat_data.晓光.生存状态.饥饿', 0);
  //   const thirst = _.get(variables, 'stat_data.晓光.生存状态.口渴', 0);
  //   const energy = _.get(variables, 'stat_data.晓光.生存状态.精力', 0);
  //   _.set(variables, 'stat_data.晓光.生存状态.饥饿', Math.max(0, hunger - 2));
  //   _.set(variables, 'stat_data.晓光.生存状态.口渴', Math.max(0, thirst - 3));
  //   _.set(variables, 'stat_data.晓光.生存状态.精力', Math.max(0, energy - 1));
  //   Mvu.replaceMvuData(variables, { type: 'message', message_id: getCurrentMessageId() });
  // }, 3600000); // 每小时

  console.info('[系统辅助] XP升级监听 + 掷骰广播已就绪');
});
