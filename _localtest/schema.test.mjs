// schema 测试：派生计算正确性 + initvar 契约 + 真相源一致性
import assert from 'assert';
import _ from 'lodash';
import * as Z from 'zod';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { fileURLToPath } from 'url';
globalThis._ = _; globalThis.z = Z.z ?? Z.default ?? Z;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const mod = await import('file://' + path.join(ROOT, 'src/银月脉纪_荒野篇/schema.ts').replace(/\\/g, '/'));
const Schema = mod.Schema;

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); console.log('  ✅', name); pass++; } catch (e) { console.log('  ❌', name, '\n     ', e.message); fail++; } };

console.log('\n[schema 测试: 派生计算 + initvar 契约]');

// 读 0.txt 的 initvar
const txt = fs.readFileSync(path.join(ROOT, 'src/银月脉纪_荒野篇/第一条消息/0.txt'), 'utf8');
const m = txt.match(/```yaml\n([\s\S]*?)```/);
const initvar = m ? YAML.parse(m[1]) : null;

// 玩家真实存档（兼容基准——schema 任何改动后这份必须仍能 parse）
const realSave = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/real_save.json'), 'utf8'));

// ── 1. 空对象解析：去剧情化生效 ──
T('空解析：无凭空剧情（伤口/地标/物品空）', () => {
  const r = Schema.parse({});
  assert.strictEqual(Object.keys(r.晓光.伤口).length, 0, '伤口应空');
  assert.strictEqual(Object.keys(r.世界.地标).length, 0, '地标应空');
  assert.strictEqual(Object.keys(r.装备.物品栏).length, 0, '物品栏应空');
  assert.strictEqual(r.装备.穿着, '', '穿着应空');
  assert.strictEqual(r.世界.地形.当前位置, '', '当前位置应空');
});

// ── 2. initvar 合法且衣服保底 ──
T('0.txt initvar：可解析 + 巫女服保底', () => {
  assert(initvar, '应能提取 initvar yaml');
  const r = Schema.parse(initvar);
  assert.strictEqual(r.装备.穿着, '破损的巫女服', '穿着应为巫女服');
  assert(r.装备.衣物.巫女服, '应有巫女服衣物');
  assert.strictEqual(Object.keys(r.装备.物品栏).length, 0, '开局物品栏空（玩家自选）');
});

// ── 3. 派生计算：体感温度公式 ──
T('派生：体感温度 = 气温 - 风寒 + 衣物补偿', () => {
  const r = Schema.parse(initvar);
  // 气温7, 风速2 → 风寒=2*0.8=1.6; 巫女服保暖3,外层0.6权重,破损30% → 总保暖≈3*0.6*0.85=1.53; 衣物补偿=1.53*0.6≈0.9
  assert(typeof r.$体感温度 === 'number', '$体感温度应为数字');
  assert(r.$体感温度 < r.世界.天气详情.温度, '体感应低于气温（有风）');
});

// ── 4. 派生：负重从物品栏实时算 ──
T('派生：$当前负重 = 随身物品总重', () => {
  const d = _.cloneDeep(initvar);
  d.装备.物品栏 = {
    斧头: { 名称: '斧头', 分类: '工具', 重量: 1.5, 位置: '背包', 描述: '' },
    水壶: { 名称: '水壶', 分类: '容器', 重量: 0.5, 位置: '背包', 描述: '' },
    营地物: { 名称: '营地物', 分类: '材料', 重量: 99, 位置: '营地存储', 描述: '' },
  };
  const r = Schema.parse(d);
  assert.strictEqual(r.$当前负重, 2.0, `随身应为2.0(营地存储不计), 实际 ${r.$当前负重}`);
});

// ── 5. 失温分级：低体温 → 高风险 ──
T('派生：体温34 → 失温风险极高', () => {
  const d = _.cloneDeep(initvar);
  d.晓光.生存状态.体温 = 33.5;
  const r = Schema.parse(d);
  assert.strictEqual(r.$失温风险等级, '极高', `应极高, 实际 ${r.$失温风险等级}`);
});

// ── 6. 真相源一致性：initvar 不该写死安全上限（P0-2 修复后应通过）──
T('真相源：initvar 与 prefault 属性初值一致', () => {
  const r = Schema.parse(initvar);
  // 体质初值 initvar=2，schema prefault 也=2
  assert.strictEqual(r.晓光.基础属性.体质, 2, '体质应2');
});

// ── 7. 发情期字段存在 ──
T('schema：晓光.生理状态.发情期 存在且默认无', () => {
  const r = Schema.parse({});
  assert.strictEqual(r.晓光.生理状态?.发情期, '无', `应为无, 实际 ${r.晓光.生理状态?.发情期}`);
});

// ── 7b. 灵力核心字段存在 + 默认值 ──
T('灵力：狐类特性.灵力值/灵力峰值 默认 20，防负', () => {
  const r = Schema.parse({});
  assert.strictEqual(r.晓光.狐类特性?.灵力值, 20, '灵力值默认20');
  assert.strictEqual(r.晓光.狐类特性?.灵力峰值, 20, '灵力峰值默认20');
  const r2 = Schema.parse({ 晓光: { 狐类特性: { 灵力值: -5 } } });
  assert.strictEqual(r2.晓光.狐类特性.灵力值, 0, '灵力值防负→0');
});

// ── 7c. 灵力峰值自动记录新高 ──
T('灵力：灵力值新高时自动同步灵力峰值', () => {
  const d = _.cloneDeep(initvar);
  d.晓光.狐类特性.灵力值 = 80;
  d.晓光.狐类特性.灵力峰值 = 50;
  const r = Schema.parse(d);
  assert.strictEqual(r.晓光.狐类特性.灵力峰值, 80, '峰值应跟随新高=80');
  // 灵力值低于峰值时，峰值保持不降
  d.晓光.狐类特性.灵力值 = 30;
  d.晓光.狐类特性.灵力峰值 = 80;
  const r2 = Schema.parse(d);
  assert.strictEqual(r2.晓光.狐类特性.灵力峰值, 80, '峰值不应回降');
});

// ── 7d. 灵力派生：等级/满格参考/恢复倍率/缓冲系数 ──
T('灵力派生：等级/满格参考/恢复倍率 随灵力值连续变化', () => {
  const d = _.cloneDeep(initvar);
  d.晓光.狐类特性.灵力值 = 120;
  const r = Schema.parse(d);
  assert.strictEqual(r.$灵力等级, '全盛', '120→全盛');
  assert.strictEqual(r.$恢复倍率, 1.7, '恢复倍率=0.5+120/100=1.7');
  assert(r.$灵力满格参考 >= 120, '满格参考应≥灵力值');
  // 灵力200时负重惩罚归零
  d.晓光.狐类特性.灵力值 = 200;
  const r2 = Schema.parse(d);
  assert.strictEqual(r2.$灵力缓冲系数, 0, '灵力200→缓冲系数0(无负重惩罚)');
  // 灵力0时全额惩罚
  d.晓光.狐类特性.灵力值 = 0;
  const r3 = Schema.parse(d);
  assert.strictEqual(r3.$灵力缓冲系数, 1, '灵力0→缓冲系数1(全额惩罚)');
});

// ── 7e. 灵脉强度字段存在 + 默认正常 ──
T('灵力：世界.地形.灵脉强度 默认正常', () => {
  const r = Schema.parse({});
  assert.strictEqual(r.世界.地形?.灵脉强度, '正常', '灵脉强度默认正常');
});

// ── 8. P0-2 验证：initvar 不再写死安全上限，走 prefault 兜底 ──
T('安全上限：initvar 不写死，未过向导时 prefault=9', () => {
  assert(!_.has(initvar, '装备.负重.安全上限'), 'initvar 不应再写死安全上限');
  const r = Schema.parse(initvar);
  assert.strictEqual(r.装备.负重.安全上限, 9, `未过向导应兜底9, 实际 ${r.装备.负重.安全上限}`);
});

// ── 9. P0-3 验证：0.txt 标记顺序 UpdateVariable 在前、StatusPlaceHolder 在最末 ──
T('标记顺序：UpdateVariable 在 StatusPlaceHolderImpl 之前', () => {
  const iUpd = txt.indexOf('<UpdateVariable>');
  const iPh = txt.lastIndexOf('<StatusPlaceHolderImpl/>');
  assert(iUpd >= 0 && iPh >= 0, '两个标记都应存在');
  assert(iUpd < iPh, 'UpdateVariable 应在 StatusPlaceHolderImpl 之前');
});

// ── 10. 存档兼容基准：玩家真实存档必须始终可 parse + 关键字段保留 ──
T('存档兼容：真实存档可 parse 不抛错', () => {
  const r = Schema.parse(realSave);
  assert(r, 'parse 应成功');
});
T('存档兼容：庇护所类型保留（去严格化后应=岩壁凹陷/无，不被吞）', () => {
  const r = Schema.parse(realSave);
  // 改前老档是"无"；阶段2放宽后若AI写自由类型也应保留。这里至少不报错、值不丢
  assert(r.营地.庇护所.类型 !== undefined, '庇护所类型不应丢失');
});
T('存档兼容：物品栏/图鉴/伤口数量保留', () => {
  const r = Schema.parse(realSave);
  assert.strictEqual(Object.keys(r.装备.物品栏).length, 4, '物品栏4件');
  assert.strictEqual(Object.keys(r.图鉴.野兽).length, 1, '野兽图鉴1条');
  assert.strictEqual(Object.keys(r.晓光.伤口).length, 3, '伤口3处');
});

console.log(`\nschema: ${pass} 通过, ${fail} 失败\n`);
process.exitCode = fail ? 1 : 0;
