// @vitest-environment node
//
// The rest of the suite runs under happy-dom, where touching `document`/`window` during setup()
// silently works. Plain Node proves components render without a browser, as in real SSR.
import { test, expect } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createLx } from '@/lib';
import * as components from '@/components';
import { afterEach as routerAfterEach } from '@/utils/flowUtils';

test('runs without browser globals', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
});

async function renderUnderSsr(component) {
  const app = createSSRApp({ render: () => h(component) });
  app.use(createLx, { systemId: 'ssr-audit', environment: 'test' });
  return renderToString(app);
}

const componentEntries = Object.entries(components);

// Guards against the sweep below passing vacuously if the '@/components' export shape changes.
test('component export list is not empty', () => {
  expect(componentEntries.length).toBeGreaterThan(50);
});

// Router guards run during SSR too, outside any component's setup().
test('flowUtils.afterEach does not throw under SSR', async () => {
  const to = { name: 'home', path: '/', params: {}, query: {} };
  const from = { name: null, path: '/', params: {}, query: {} };
  const appStore = { stopNavigating: () => {} };
  const viewStore = { $reset: () => {} };

  await routerAfterEach(to, from, appStore, viewStore);
});

test.each(componentEntries)(
  '%s: setup() does not throw for a missing browser global under SSR',
  async (name, component) => {
    try {
      await renderUnderSsr(component);
    } catch (err) {
      // Only a ReferenceError for a missing global is an SSR bug; other errors (e.g. missing
      // required props) are unrelated to rendering without a browser.
      if (err instanceof ReferenceError && / is not defined$/.test(err.message)) {
        throw new Error(
          `${name} accesses a browser global unconditionally during setup(), breaking SSR: ${err.message}`
        );
      }
    }
  }
);
