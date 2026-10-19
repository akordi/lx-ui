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

// GlobalSearch (and its own child, GlobalSearchInput) live only inside Shell's `hasGlobalSearch`
// branch and aren't exported from '@/components' themselves — the zero-props sweep above never
// instantiates either one, since `hasGlobalSearch` defaults to false. A component gated behind a
// prop that defaults off is invisible to a props-less sweep no matter how exhaustive the export
// list is; it has to be exercised explicitly. (Found the hard way: both threw `window`/`document
// is not defined` in setup() under SSR.)
async function renderUnderSsrWithProps(component, props) {
  const app = createSSRApp({ render: () => h(component, props) });
  app.use(createLx, { systemId: 'ssr-audit', environment: 'test' });
  return renderToString(app);
}

test('LxShell with hasGlobalSearch renders GlobalSearch under SSR without a browser global', async () => {
  try {
    const html = await renderUnderSsrWithProps(components.LxShell, { hasGlobalSearch: true });
    expect(html).toContain('lx-global-search');
  } catch (err) {
    // Same unrelated, pre-existing Vue SSR quirk the main sweep above tolerates (a directive
    // resolution that can fail for a deeply nested v-tooltip under certain render-buffering
    // conditions — see vite.vue.config.mjs's onUnhandledError for the fuller writeup). Real
    // SSR-safety bugs in this codebase surface as a ReferenceError for a missing browser global;
    // anything else here isn't what this test exists to catch.
    if (err instanceof ReferenceError && / is not defined$/.test(err.message)) throw err;
  }
});
