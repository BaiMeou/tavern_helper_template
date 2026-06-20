import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

// 酒馆 iframe 环境下某些 SillyTavern 版本未暴露 Element/SVGElement/MathMLElement
// 全局，导致 Vue mount 内部 `l instanceof Element` 等检查抛出
// "Right-hand side of 'instanceof' is not an object"。这里提供安全 polyfill。
// 顺序很关键：必须在 createApp(...).mount(...) 调用之前完成。
(function polyfillIframeGlobals() {
  const g = globalThis as any;
  // Element 是 Vue 注入 v-cloak 时的检查目标
  if (typeof g.Element === 'undefined') {
    g.Element = function () { /* polyfill: instanceof 永远 false */ };
  }
  if (typeof g.SVGElement === 'undefined') {
    g.SVGElement = function () {};
  }
  if (typeof g.MathMLElement === 'undefined') {
    g.MathMLElement = function () {};
  }
  // HTMLElement 也补一下，以防内部其他检查也用
  if (typeof g.HTMLElement === 'undefined') {
    g.HTMLElement = function () {};
  }
  // Storage 用于 useStorage 等响应式存储 hook
  if (typeof g.Storage === 'undefined') {
    g.Storage = function () {};
  }
})();

async function init() {
  await waitGlobalInitialized('Mvu');
  await waitUntil(
    () => _.has(getVariables({ type: 'message', message_id: getCurrentMessageId() }), 'stat_data'),
    { timeout: Number.POSITIVE_INFINITY },
  );
  createApp(App).use(createPinia()).mount('#app');
}

$(() => {
  errorCatched(init)();
});
