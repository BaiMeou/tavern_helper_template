// 一键跑全部本地测试
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tests = [
  { name: '脚本引擎', file: 'engine.test.mjs', runner: 'node' },
  { name: 'schema',  file: 'schema.test.mjs', runner: 'npx', args: ['tsx'] },
  { name: '集成同步', file: 'integration.test.mjs', runner: 'node' },
];

let allOk = true;
for (const t of tests) {
  const cmd = t.runner === 'npx' ? 'npx' : 'node';
  const args = t.runner === 'npx' ? [...t.args, path.join(__dirname, t.file)] : [path.join(__dirname, t.file)];
  const r = spawnSync(cmd, args, { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', shell: true });
  process.stdout.write(r.stdout || '');
  if (r.stderr && r.status !== 0) process.stderr.write(r.stderr);
  if (r.status !== 0) allOk = false;
}
console.log(allOk ? '\n══════ 全部本地测试通过 ✅ ══════\n' : '\n══════ 有测试失败 ❌ ══════\n');
process.exitCode = allOk ? 0 : 1;
