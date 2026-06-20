import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

// 酒馆 iframe 环境下某些浏览器/SillyTavern 版本未暴露 SVGElement / MathMLElement
// 全局，导致 Vue mount 时内部 normalizeContainer 调用 `e instanceof SVGElement`
// 抛出 "Right-hand side of 'instanceof' is not an object"。这里提供安全 polyfill。
if (typeof (globalThis as any).SVGElement === 'undefined') {
  (globalThis as any).SVGElement = function () { /* polyfill: 空构造,instanceof 永远 false */ };
}
if (typeof (globalThis as any).MathMLElement === 'undefined') {
  (globalThis as any).MathMLElement = function () { /* polyfill */ };
}

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
