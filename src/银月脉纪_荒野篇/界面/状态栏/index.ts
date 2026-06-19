import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

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
