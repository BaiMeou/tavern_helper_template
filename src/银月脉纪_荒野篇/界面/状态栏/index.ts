import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

// 酒馆 iframe 环境下某些 SillyTavern 版本未暴露 Element/SVGElement/MathMLElement/HTMLElement/Storage
// 全局（或它们存在但为 undefined / 不是构造器），导致 Vue mount 内部
// `l instanceof Element` 等检查抛 "Right-hand side of 'instanceof' is not an object"。
// 这里提供鲁棒 polyfill：只要发现不是函数/对象就强制覆盖，并多重 fallback（globalThis / window / self）。
function polyfillIframeGlobals() {
  const Noop = function NoopElement() {} as unknown as { new (): unknown };
  const targets: any[] = [];
  if (typeof globalThis !== 'undefined') targets.push(globalThis);
  if (typeof window !== 'undefined' && !targets.includes(window)) targets.push(window);
  if (typeof self !== 'undefined' && !targets.includes(self)) targets.push(self);
  const keys = ['Element', 'HTMLElement', 'SVGElement', 'MathMLElement', 'Storage', 'Node', 'CharacterData', 'Text', 'DocumentFragment'];
  for (const tgt of targets) {
    for (const k of keys) {
      try {
        const v = tgt[k];
        if (typeof v !== 'function' && (typeof v !== 'object' || v === null)) {
          // 强制覆盖：先删后赋值，避免 non-writable 属性
          try {
            delete tgt[k];
          } catch {
            // ignore
          }
          try {
            tgt[k] = Noop;
          } catch {
            // ignore，尝试 defineProperty
            try {
              Object.defineProperty(tgt, k, { value: Noop, writable: true, configurable: true });
            } catch {
              // 实在不行就放弃这个 target/key
            }
          }
        }
      } catch {
        // 读取也可能抛（某些 sandbox），忽略
      }
    }
  }
}

// 在 module 顶层立即执行一次，覆盖大多数情况
polyfillIframeGlobals();

async function init() {
  // 在 mount 前再补一次，防止某些时序下顶层执行被吞
  polyfillIframeGlobals();
  await waitGlobalInitialized('Mvu');
  await waitUntil(
    () => _.has(getVariables({ type: 'message', message_id: getCurrentMessageId() }), 'stat_data'),
    { timeout: Number.POSITIVE_INFINITY },
  );
  // 第三道保险：mount 前最后一次
  polyfillIframeGlobals();
  createApp(App).use(createPinia()).mount('#app');
}

$(() => {
  errorCatched(init)();
});
