// 本地测试台：在 Node 里加载酒馆脚本，mock 全局，捕获事件处理器，驱动它跑。
// 用法：被各 *.test.mjs 引入。
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── mock 的事件总线 ──
export function makeHarness({ seed = 1 } = {}) {
  const handlers = { VARIABLE_UPDATE_ENDED: [] };
  const toasts = [];
  const logs = [];
  const pending = [];

  // 确定性随机：线性同余，便于复现
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };

  const globals = {
    _,
    Math: Object.assign(Object.create(Math), { random: rand }),
    Mvu: { events: { VARIABLE_UPDATE_ENDED: 'VARIABLE_UPDATE_ENDED', COMMAND_PARSED: 'COMMAND_PARSED', VARIABLE_UPDATE_STARTED: 'VARIABLE_UPDATE_STARTED' } },
    eventOn: (evt, fn) => { (handlers[evt] ||= []).push(fn); },
    waitGlobalInitialized: async () => {},
    errorCatched: (fn) => fn,
    $: (fn) => { if (typeof fn === 'function') pending.push(Promise.resolve().then(fn)); return { ready: (f) => f && f() }; },
    toastr: new Proxy({}, { get: () => (msg, title) => toasts.push({ title, msg }) }),
    console: { info: (...a) => logs.push(['info', ...a]), warn: (...a) => logs.push(['warn', ...a]), error: (...a) => logs.push(['error', ...a]), log: (...a) => logs.push(['log', ...a]) },
  };

  return { handlers, toasts, logs, rand, globals,
    // 等待脚本顶层 $(...) 注册的 async init 跑完（handler 注册完成）
    async ready() { while (pending.length) { const p = pending.splice(0); await Promise.all(p); } },
    // 触发一次 VARIABLE_UPDATE_ENDED：把 variables 依次过所有 handler
    fire(variables, old_variables) {
      for (const fn of handlers.VARIABLE_UPDATE_ENDED) fn(variables, old_variables);
      return variables;
    },
  };
}

// 编译并在 mock 全局下执行一个 .ts 脚本（顶层无 import 的酒馆脚本）
export function loadScript(relPath, harness) {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const g = harness.globals;
  // 用 Function 注入 mock 全局作为形参
  const names = Object.keys(g);
  const fn = new Function(...names, 'module', 'exports', js);
  const mod = { exports: {} };
  fn(...names.map(n => g[n]), mod, mod.exports);
  return mod.exports;
}
