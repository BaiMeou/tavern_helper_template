// ═══════════════════════════════════════════════════════════════
// 系统辅助脚本 — 引擎核心
//  · XP 稀缺硬保证（限流+递增阈值+连升）
//  · 精神危机硬保证：崩溃最多 3 轮后强制回升至动摇（精神 ≥25%）
//  · 掷骰：AI 写 $掷骰请求 字段 → 此处读取并掷骰回写结果（不暴露前端掷骰）
//  · 时间与代谢推进：AI 写 $推进时段 时按规则结算生存状态
//  · 伤病演化：伤口随天数推进愈合、感染风险演化；饮生水/腐食掷骰生病
//  · 陷阱每日结算：按陷阱类型概率推进状态机
//  · 物品老化：耐久/电量/保质期随使用和时间衰减
// ═══════════════════════════════════════════════════════════════

// XP 升级阈值随等级递增（越高越难）
function xpThreshold(level: number): number {
  return Math.round(100 * Math.pow(1.15, level - 1)); // Lv1→100 Lv5→175 Lv10→352 Lv19→1230，平缓且clamp(99999)可达
}
// 单轮每项 XP 增量上限（硬限流，防 AI 滥发）
const XP_PER_ROUND_CAP = 8;
// 每项 XP 连加衰减记录（key→最近一次加值），同项连续追加会衰减
const xpRecentGain: Record<string, number> = {};

async function init() {
  await waitGlobalInitialized('Mvu');

  // ─── XP 限流 + 自动升级（单监听器，先限流后升级，顺序确定无竞态） ───
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables: any) => {
    if (!variables?.stat_data?.晓光) return;
    const 属性 = ['体质', '敏捷', '意志', '感知']; // 智力固定，不参与 XP
    for (const 名称 of 属性) {
      const xpKey = `${名称}XP`;
      // ── 第一步：硬限流（拦截本轮超额 XP 增量）──
      const cur = _.get(variables, `stat_data.晓光.属性成长.${xpKey}`, 0) ?? 0;
      const prev = xpRecentGain[xpKey + ':prev'] ?? cur;
      let delta = cur - prev;
      if (delta > XP_PER_ROUND_CAP) {
        _.set(variables, `stat_data.晓光.属性成长.${xpKey}`, prev + XP_PER_ROUND_CAP);
        console.warn(`[系统辅助] ${xpKey} 本轮增量 ${delta} 超上限，截断为 ${XP_PER_ROUND_CAP}`);
        delta = XP_PER_ROUND_CAP;
      }
      // 连续追加衰减：连续≥3轮加同一项，后续减半
      xpRecentGain[xpKey + ':streak'] = (delta > 0 ? (xpRecentGain[xpKey + ':streak'] ?? 0) + 1 : 0);
      if ((xpRecentGain[xpKey + ':streak'] ?? 0) >= 3 && delta > 0) {
        _.set(variables, `stat_data.晓光.属性成长.${xpKey}`, prev + Math.floor(delta / 2));
      }
      // ── 第二步：升级（连升，用限流后的真实 XP）──
      const xp = _.get(variables, `stat_data.晓光.属性成长.${xpKey}`, 0);
      const level = _.get(variables, `stat_data.晓光.基础属性.${名称}`, 1);
      if (xp >= xpThreshold(level) && level < 20) {
        let remaining = xp;
        let newLevel = level;
        while (remaining >= xpThreshold(newLevel) && newLevel < 20) {
          remaining -= xpThreshold(newLevel);
          newLevel += 1;
        }
        _.set(variables, `stat_data.晓光.基础属性.${名称}`, newLevel);
        _.set(variables, `stat_data.晓光.属性成长.${xpKey}`, remaining);
        toastr.success(`${名称} 升级！${level} → ${newLevel}`);
        console.info(`[系统辅助] ${名称}升级: ${level}→${newLevel}, XP余: ${remaining}`);
      }
      // ── 第三步：记录本轮基线（升级后的值，供下轮限流对比）──
      xpRecentGain[xpKey + ':prev'] = _.get(variables, `stat_data.晓光.属性成长.${xpKey}`, 0);
    }
  });

  // ─── 精神危机硬保证：崩溃最多持续 3 轮后自动回升至“动摇” ───
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables: any) => {
    if (!variables?.stat_data?.晓光) return;
    const 执念 = variables.stat_data.晓光.执念 || {};
    if (执念.状态 === '崩溃') {
      const 轮次 = Number(variables.stat_data.$崩溃轮次 ?? 0) + 1;
      variables.stat_data.$崩溃轮次 = 轮次;
      if (轮次 >= 3) {
        variables.stat_data.晓光.执念 = {
          ...执念,
          状态: '动摇',
          近期波动: '崩溃超过 3 轮后被动回升至动摇',
        };
        const 当前精神 = Number(variables.stat_data.晓光.生存状态?.精神 ?? 75);
        variables.stat_data.晓光.生存状态 = {
          ...(variables.stat_data.晓光.生存状态 || {}),
          精神: Math.max(当前精神, 25),
        };
        variables.stat_data.$崩溃轮次 = 0;
      }
    } else {
      if (variables.stat_data.$崩溃轮次) variables.stat_data.$崩溃轮次 = 0;
    }
  });

  // ─── 掷骰引擎：AI 写 stat_data.$掷骰请求 = { 类型, ... } 触发 ───
  // 类型：'搜刮' | '狩猎' | '铃铛' | '饮生水' | '生火' | '攀爬'（陷阱不走即时掷骰，由过夜结算自动判定）
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables: any) => {
    const req = variables?.stat_data?.$掷骰请求;
    if (!req || typeof req !== 'object') return;
    const 晓光 = variables.stat_data.晓光 || {};
    const 基础属性 = 晓光.基础属性 || {};
    const roll = (n = 100) => Math.floor(Math.random() * n) + 1;
    let 结果: any = null;
    let 同步给AI = '';
    switch (req.类型) {
      case '搜刮': {
        const 感知 = 基础属性.感知 ?? 4;
        const bonus = (感知 - 1) * 3;
        // 候选物品来源：req.物品（AI/前端显式提供） 或 stat_data.$待搜刮货舱（向导阶段记录的行李舱物品）
        let 候选 = Array.isArray(req.物品) ? req.物品 : [];
        const usingPending = 候选.length === 0;
        if (usingPending) {
          const pending = _.get(variables, 'stat_data.$待搜刮货舱', []);
          候选 = Array.isArray(pending) ? pending : [];
        }
        const 拾取 = 候选.map((it: any) => {
          const r = roll();
          const adj = r + bonus - (it.易损度 || 0);
          const cond = adj >= 80 ? { 标签: '完好', 耐久: 100, 可修: false, 可拆: false }
            : adj >= 55 ? { 标签: '少耐久', 耐久: 40 + Math.floor(Math.random() * 30), 可修: false, 可拆: false }
            : adj >= 30 ? { 标签: '部分损坏', 耐久: 10 + Math.floor(Math.random() * 20), 可修: true, 可拆: true }
            : { 标签: '损坏', 耐久: 0, 可修: false, 可拆: true };
          return { id: it.id, 名称: it.名称, 重量: it.重量, 描述: it.描述, 分类: it.分类, r, adj, ...cond };
        });
        // 行李舱搜刮：把存活的物品自动入物品栏，并清空 $待搜刮货舱
        if (usingPending && 拾取.length > 0) {
          for (const item of 拾取) {
            if (item.标签 === '损坏') continue;
            const entry: any = {
              名称: item.名称,
              分类: item.分类 || '特殊',
              重量: item.重量,
              位置: '背包',
              描述: item.描述 || '',
              耐久度: item.耐久,
            };
            if (item.可修) entry.描述 = (entry.描述 || '') + ' [部分损坏·可修理]';
            if (item.可拆 && !item.可修) entry.描述 = (entry.描述 || '') + ' [严重损坏·可拆解]';
            _.set(variables, `stat_data.装备.物品栏.cargo_${item.id}`, entry);
          }
          _.set(variables, 'stat_data.$待搜刮货舱', []);
        }
        结果 = { 拾取, 来源: usingPending ? '行李舱搜刮' : 'AI候选' };
        同步给AI = `搜刮掷骰完成：感知加成+${bonus}，共${拾取.length}件候选，存活${拾取.filter((x: any) => x.标签 !== '损坏').length}件（${拾取.map((x: any) => `${x.名称}(${x.标签}·${x.耐久}%)`).join('、')}）${usingPending ? '——已将存活物品自动收入物品栏' : ''}`;
        break;
      }
      case '狩猎': {
        const 敏捷 = 基础属性.敏捷 ?? 2;
        const 感知 = 基础属性.感知 ?? 4;
        const bonus = (敏捷 - 1) / 60 + (感知 - 1) / 80;
        const r = Math.random() + bonus;
        let label: string;
        if (r > 0.85) label = '大获成功——捕获了猎物';
        else if (r > 0.6) label = '有所收获——抓住了小型猎物';
        else if (r > 0.35) label = '勉强成功——只抓到些小东西';
        else if (r > 0.15) label = '失手了——猎物逃走了';
        else label = '毫无收获——今天运气不佳';
        结果 = { 文字: label, 骰值: Math.round(r * 100) / 100 };
        同步给AI = `狩猎掷骰：${label}`;
        break;
      }
      case '铃铛': {
        const d6 = roll(6);
        const 灵力环境 = _.get(variables, 'stat_data.晓光.狐类特性.灵力环境', '稀薄');
        const 修正 = 灵力环境 === '稀薄' ? -2 : 灵力环境 === '正常' ? 0 : 2;
        const adj = Math.max(1, d6 + 修正);
        let label: string;
        // 统一为"高骰=好"：5-6 回响、3-4 轻响、1-2 无声（与铃铛奇迹 filter 一致）
        if (adj >= 5) label = '铃铛发出了一声清脆的回响——在这一刻，她仿佛听到了主人的声音';
        else if (adj >= 3) label = '铃铛轻响了一声——微弱，但确实响了';
        else label = '铃铛无声——和之前几次一样，森林依旧沉默';
        结果 = { 文字: label, 骰值: adj, 回响: adj >= 5 };
        // 闭环：立即事件/铃铛奇迹 filter 读 $上次铃铛结果 并 .includes('回响')
        _.set(variables, 'stat_data.$上次铃铛结果', adj >= 5 ? '回响' : adj >= 3 ? '轻响' : '无声');
        同步给AI = `铃铛掷骰(d6+灵力修正=${修正})：${label}`;
        break;
      }
      case '饮生水': {
        const r = roll();
        // 23% 基础患病概率
        const 患病 = r <= 23;
        结果 = { 患病, 骰值: r };
        if (患病) {
          const 疾病 = {
            症状: '腹痛、腹泻、轻度脱水',
            严重度: '轻微',
            阶段: '潜伏期',
            传染性: '无',
            处理方式: '静养、补充水分、止泻药',
          };
          _.set(variables, 'stat_data.晓光.疾病.水源性肠胃炎', 疾病);
          同步给AI = '饮生水掷骰：患病！晓光得了水源性肠胃炎（腹痛腹泻+脱水风险）';
        } else {
          同步给AI = `饮生水掷骰(${r})：侥幸无事，但反复饮用生水风险累积`;
        }
        break;
      }
      case '生火': {
        const r = roll();
        const 雨天修正 = req.雨天 ? -30 : 0;
        const 有引火物 = req.引火物 ? 10 : -15;
        const adj = r + 雨天修正 + 有引火物;
        const 成功 = adj >= 40;
        结果 = { 成功, 骰值: r, adj };
        同步给AI = `生火掷骰：${成功 ? '点燃成功' : '失败——火苗没能燃起来'}`;
        break;
      }
      case '攀爬': {
        const 敏捷 = 基础属性.敏捷 ?? 2;
        const r = roll();
        const adj = r + (敏捷 - 1) * 4;
        const 成功 = adj >= 50;
        结果 = { 成功, 骰值: r, adj, 摔伤: !成功 && r < 20 };
        同步给AI = `攀爬掷骰：${成功 ? '成功' : '失败' + (r < 20 ? '·可能摔伤' : '')}`;
        break;
      }
      default:
        结果 = { 错误: '未知掷骰类型' };
        同步给AI = `未知掷骰类型：${req.类型}`;
    }
    // 写回结果 + $前端操作 让 AI 据此叙事
    _.set(variables, 'stat_data.$上次掷骰', { 类型: req.类型, 结果, 时间: req.时间 });
    // 累积到 AI 操作记忆（环形 5 条）
    const 操作记忆 = _.get(variables, 'stat_data.$近期操作', []) as any[];
    操作记忆.push({ t: req.时间 || '现在', text: 同步给AI });
    while (操作记忆.length > 5) 操作记忆.shift();
    _.set(variables, 'stat_data.$近期操作', 操作记忆);
    _.set(variables, 'stat_data.$前端操作', `[引擎掷骰] ${同步给AI}`);
    // 清除触发字段（一次性）
    _.set(variables, 'stat_data.$掷骰请求', null);
  });

  // ─── 合成引擎：AI/前端写 $合成请求 = { 配方名 } → 脚本校验材料+智力+工具 → 扣减+产出 ───
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables: any) => {
    const req = variables?.stat_data?.$合成请求;
    if (!req || typeof req !== 'object') return;
    const 配方名 = req.配方名;
    const 配方 = _.get(variables, `stat_data.工坊.配方.${配方名}`);
    const 物品栏 = _.get(variables, 'stat_data.装备.物品栏', {}) as Record<string, any>;
    let 同步给AI = '';
    let 成功 = false;
    if (!配方) {
      同步给AI = `合成失败：配方「${配方名}」不存在或未解锁`;
    } else if (!配方.已解锁) {
      同步给AI = `合成失败：配方「${配方名}」尚未解锁`;
    } else {
      const 智力 = _.get(variables, 'stat_data.晓光.基础属性.智力', 8);
      if (配方.所需智力 && 智力 < 配方.所需智力) {
        同步给AI = `合成失败：智力不足（需${配方.所需智力}，当前${智力}）`;
      } else {
        // 校验材料：所需材料是 {材料名: 数量}，材料名可能对应物品栏的某个 item key 或 item.名称
        const 缺口: string[] = [];
        for (const [mat, need] of Object.entries(配方.所需材料 || {})) {
          const needN = Number(need) || 0;
          // 先按 key 精确匹配，再按 名称 模糊匹配
          let have = 0;
          if (物品栏[mat]) have = (物品栏[mat].数量 ?? 1);
          if (have < needN) {
            // 按 名称 找
            for (const [k, it] of Object.entries(物品栏) as [string, any][]) {
              if (it.名称 === mat) { have = (it.数量 ?? 1); break; }
            }
          }
          if (have < needN) 缺口.push(`${mat}(${needN}/${have})`);
        }
        if (缺口.length) {
          同步给AI = `合成失败：材料不足——${缺口.join('、')}`;
        } else {
          // 扣减材料
          for (const [mat, need] of Object.entries(配方.所需材料 || {})) {
            const needN = Number(need) || 0;
            let key = mat;
            if (!物品栏[key]) {
              for (const [k, it] of Object.entries(物品栏) as [string, any][]) {
                if (it.名称 === mat) { key = k; break; }
              }
            }
            const it = 物品栏[key];
            if (!it) continue;
            const cur = it.数量 ?? 1;
            if (cur > needN) {
              it.数量 = cur - needN;
            } else {
              delete 物品栏[key];
            }
          }
          // 产出新物品
          const 产出 = 配方.产出物 || 配方名;
          const 产key = 产出;
          if (物品栏[产key]) {
            物品栏[产key].数量 = (物品栏[产key].数量 ?? 1) + (配方.产出数量 ?? 1);
          } else {
            物品栏[产key] = {
              名称: 产出,
              分类: 配方.产出分类 || '自制',
              重量: 配方.产出重量 ?? 0,
              位置: '背包',
              描述: 配方.效果描述 || `由${配方名}合成`,
              ...(配方.产出数量 ? { 数量: 配方.产出数量 } : {}),
            };
          }
          成功 = true;
          同步给AI = `合成成功：${配方名} → 产出「${产出}」×${配方.产出数量 ?? 1}，材料已扣减`;
        }
      }
    }
    _.set(variables, 'stat_data.装备.物品栏', 物品栏);
    _.set(variables, 'stat_data.$上次合成', { 配方名, 成功, 时间: req.时间 });
    const 操作记忆 = _.get(variables, 'stat_data.$近期操作', []) as any[];
    操作记忆.push({ t: req.时间 || '现在', text: 同步给AI });
    while (操作记忆.length > 5) 操作记忆.shift();
    _.set(variables, 'stat_data.$近期操作', 操作记忆);
    _.set(variables, 'stat_data.$前端操作', `[引擎合成] ${同步给AI}`);
    _.set(variables, 'stat_data.$合成请求', null);
  });

  // ─── 时间与代谢推进：AI 写 $推进时段 时按规则结算 ───
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables: any) => {
    if (!variables?.stat_data?.$推进时段) return;
    const 推进 = variables.stat_data.$推进时段; // '次日'|'黄昏'|'夜晚'（仅这三个值触发代谢结算，其它时段切换直接改 世界.时间.时段）
    const 晓光 = variables.stat_data.晓光 || {};
    const 生存 = 晓光.生存状态 || {};
    const 营养 = 晓光.营养代谢 || {};
    const 基础属性 = 晓光.基础属性 || {};
    const 灵力 = 晓光.狐类特性?.灵力环境 ?? '稀薄';
    const 恢复倍率 = _.get(variables, 'stat_data.$恢复倍率', 0.7);
    const 有庇护所 = variables.stat_data.营地?.庇护所?.类型 && variables.stat_data.营地?.庇护所?.类型 !== '无';
    const 火状态 = variables.stat_data.营地?.篝火?.状态;
    const 有火 = ['点燃', '旺盛'].includes(火状态);
    const 床铺 = 晓光.睡眠?.床铺类型 ?? '无';

    // 电子设备待机自然耗电：手机/头灯等放着也会缓慢掉电（屏幕检查、待机损耗）。
    // 主动使用（提问3%、手电1%/min）的额外消耗仍由 AI 叙事时另写——这里只补"时间流逝→自然掉电"。
    // 过夜多为关屏待机，掉得少；白天单时段待机掉得稍多。电量到 0 视为关机。
    const 衰减电量 = (每设备: number) => {
      const 物品栏 = variables.stat_data.装备?.物品栏 || {};
      for (const [key, item] of Object.entries(物品栏) as [string, any][]) {
        if (item?.分类 !== '电子') continue;
        if (typeof item.电量 !== 'number') continue;
        if (item.电量 <= 0) continue;
        _.set(variables, `stat_data.装备.物品栏.${key}.电量`, Math.max(0, Math.round((item.电量 - 每设备) * 10) / 10));
      }
    };

    if (推进 === '次日') {
      // 过夜结算：天数+1，时段=清晨
      const 天数 = _.get(variables, 'stat_data.世界.时间.天数', 0) + 1;
      _.set(variables, 'stat_data.世界.时间.天数', 天数);
      _.set(variables, 'stat_data.世界.时间.时段', '清晨');
      // 一夜代谢：基础代谢率消耗（约 1450kcal/夜按睡眠8h计约 480kcal）
      const bmr = 营养.基础代谢率 ?? 1450;
      const 摄入 = _.get(营养, '今日摄入.卡路里', 0);
      // 入不敷出 → 动用体脂（全天摄入 vs 全天基础代谢）
      if (摄入 < bmr) {
        const 缺口 = bmr - 摄入;
        const 体脂 = _.get(营养, '体脂储备', 18);
        // 每 7700kcal 缺口 ≈ 1kg 脂肪 ≈ 2% 体脂
        const 体脂降 = Math.max(0, (缺口 / 7700) * 2);
        _.set(variables, 'stat_data.晓光.营养代谢.体脂储备', Math.round((体脂 - 体脂降) * 10) / 10);
      }
      // 重置今日摄入
      _.set(variables, 'stat_data.晓光.营养代谢.今日摄入', { 卡路里: 0, 蛋白质克: 0, 脂肪克: 0, 碳水克: 0 });
      // 睡眠恢复：精力 + 睡眠债务 偿还，受床铺/庇护所/火/灵力影响
      const 睡眠质量 = (床铺 === '无' ? 0.4 : 床铺 === '裸地' ? 0.5 : 床铺 === '草垫' ? 0.7 : 0.9)
        * (有庇护所 ? 1.1 : 0.8) * (有火 ? 1.1 : 0.95) * 恢复倍率;
      const 精力恢复 = Math.round(45 * 睡眠质量);
      _.set(variables, 'stat_data.晓光.生存状态.精力', Math.min(100, (生存.精力 ?? 30) + 精力恢复));
      const 债务 = _.get(variables, 'stat_data.晓光.睡眠.睡眠债务', 4);
      _.set(variables, 'stat_data.晓光.睡眠.睡眠债务', Math.max(0, 债务 - 6 * 睡眠质量));
      _.set(variables, 'stat_data.晓光.睡眠.上次睡眠时长', Math.round(8 * 睡眠质量 * 10) / 10);
      _.set(variables, 'stat_data.晓光.睡眠.睡眠质量', 睡眠质量 > 0.85 ? '深睡' : 睡眠质量 > 0.6 ? '正常' : '浅眠');
      _.set(variables, 'stat_data.晓光.睡眠.床铺类型', 床铺);
      // 伤口愈合推进：每过一夜推进一阶段（出血→凝血→结痂→愈合中→已愈合），灵力稀薄时减半概率
      const 伤口 = variables.stat_data.晓光?.伤口 || {};
      for (const [name, w] of Object.entries(伤口) as [string, any][]) {
        if (w.愈合阶段 === '已愈合' || w.愈合阶段 === '留疤') continue;
        const 阶段序 = ['出血', '凝血', '结痂', '愈合中', '已愈合'].indexOf(w.愈合阶段);
        if (阶段序 < 0) continue;
        const 推进概率 = 恢复倍率 * 0.6 * (w.处理方式 ? 1.2 : 1);
        if (Math.random() < 推进概率) {
          const 新阶段 = ['出血', '凝血', '结痂', '愈合中', '已愈合'][Math.min(阶段序 + 1, 4)];
          _.set(variables, `stat_data.晓光.伤口.${name}.愈合阶段`, 新阶段);
          if (新阶段 === '已愈合') _.set(variables, `stat_data.晓光.伤口.${name}.预计愈合天数`, 0);
        }
        // 感染风险演化：未处理的脏伤口可能升级
        if (w.感染风险 === '低' && !w.处理方式 && Math.random() < 0.15) {
          _.set(variables, `stat_data.晓光.伤口.${name}.感染风险`, '中');
        } else if (w.感染风险 === '中' && Math.random() < 0.1) {
          _.set(variables, `stat_data.晓光.伤口.${name}.感染风险`, '高');
        } else if (w.感染风险 === '高' && Math.random() < 0.4) {
          _.set(variables, `stat_data.晓光.伤口.${name}.感染风险`, '已感染');
          const 健康 = _.get(variables, 'stat_data.晓光.生存状态.健康', 78);
          _.set(variables, 'stat_data.晓光.生存状态.健康', Math.max(0, 健康 - 8));
        }
      }
      // 食物腐败推进：保质期-1天，腐败风险演化
      const 食物 = variables.stat_data.营地?.食物库存 || {};
      for (const [name, f] of Object.entries(食物) as [string, any][]) {
        const 剩 = (f.保质期剩余天 ?? 0) - 1;
        _.set(variables, `stat_data.营地.食物库存.${name}.保质期剩余天`, Math.max(0, 剩));
        if (剩 <= 0) _.set(variables, `stat_data.营地.食物库存.${name}.腐败风险`, '已腐败');
        else if (剩 <= 1) _.set(variables, `stat_data.营地.食物库存.${name}.腐败风险`, '即将腐败');
        else if (剩 <= 3) _.set(variables, `stat_data.营地.食物库存.${name}.腐败风险`, '需尽快食用');
      }
      // 篝火熄灭（无人添柴过夜）
      if (火状态 && 火状态 !== '熄灭' && 火状态 !== '未点燃') {
        _.set(variables, 'stat_data.营地.篝火.状态', '熄灭');
        _.set(variables, 'stat_data.营地.篝火.燃料余量', 0);
      }
      // 陷阱每日结算
      const 陷阱 = variables.stat_data.工坊?.陷阱 || {};
      for (const [name, t] of Object.entries(陷阱) as [string, any][]) {
        if (t.状态 !== '待机') continue;
        const 类型概率: Record<string, number> = {
          '绳索陷阱': 0.30, '钢丝锯陷阱': 0.18, '弹性拉索陷阱': 0.18,
          '落穴陷阱': 0.35, '网陷阱': 0.25, '简易钓钩': 0.40, '藤蔓陷阱': 0.22,
        };
        const p = 类型概率[t.类型] ?? 0.20;
        if (Math.random() < p) {
          _.set(variables, `stat_data.工坊.陷阱.${name}.状态`, '捕获成功');
          _.set(variables, `stat_data.工坊.陷阱.${name}.布置天数`, (t.布置天数 ?? 0) + 1);
        } else if (Math.random() < 0.05) {
          _.set(variables, `stat_data.工坊.陷阱.${name}.状态`, '已损坏');
        } else {
          _.set(variables, `stat_data.工坊.陷阱.${name}.布置天数`, (t.布置天数 ?? 0) + 1);
        }
      }
      // 过夜电子设备待机耗电（关屏待机，掉得少）
      衰减电量(1);
    } else if (推进 === '黄昏' || 推进 === '夜晚') {
      // 一个时段的代谢消耗：饥饿口渴下降
      const 时段系数 = 推进 === '夜晚' ? 1.5 : 1;
      _.set(variables, 'stat_data.晓光.生存状态.饥饿', Math.max(0, (生存.饥饿 ?? 85) - 4 * 时段系数));
      _.set(variables, 'stat_data.晓光.生存状态.口渴', Math.max(0, (生存.口渴 ?? 55) - 6 * 时段系数));
      _.set(variables, 'stat_data.晓光.生存状态.精力', Math.max(0, (生存.精力 ?? 38) - 5 * 时段系数));
      // 体温受失温风险影响
      const 失温风险 = _.get(variables, 'stat_data.$失温风险等级', '正常');
      if (失温风险 === '极高') _.set(variables, 'stat_data.晓光.生存状态.体温', Math.max(30, (生存.体温 ?? 36.8) - 0.8));
      else if (失温风险 === '高') _.set(variables, 'stat_data.晓光.生存状态.体温', Math.max(30, (生存.体温 ?? 36.8) - 0.4));
      else if (失温风险 === '偏高') _.set(variables, 'stat_data.晓光.生存状态.体温', Math.max(30, (生存.体温 ?? 36.8) - 0.15));
      // 睡眠债务累积
      const 债务 = _.get(variables, 'stat_data.晓光.睡眠.睡眠债务', 4);
      if (推进 === '夜晚' && 床铺 === '无') {
        _.set(variables, 'stat_data.晓光.睡眠.睡眠债务', Math.min(48, 债务 + 2));
      }
      // 单时段电子设备待机耗电（白天待机检查，掉得稍多）
      衰减电量(2);
    } else {
      // 未识别的推进值：不结算，但写回 $前端操作 让 AI 知道参数无法识别（避免"时间看似推进却无变化"的困惑）
      console.warn(`[系统辅助] $推进时段="${推进}" 非法（仅支持 次日/黄昏/夜晚），未做任何代谢结算。纯叙事时段切换请直接改 世界.时间.时段`);
      _.set(variables, 'stat_data.$前端操作', `时间推进参数"${推进}"无法识别（仅支持 次日/黄昏/夜晚）——未结算代谢。若只是叙事时段切换，请直接修改 世界.时间.时段`);
    }
    // 清除触发字段
    _.set(variables, 'stat_data.$推进时段', null);
  });

  console.info('[系统辅助] XP限流 + 掷骰引擎 + 代谢推进 + 伤病演化 + 陷阱结算 已就绪');
}

$(() => {
  errorCatched(init)();
});
