// @vitest-environment node
//
// The rest of the suite runs under happy-dom (a fake browser), so a
// component that reaches for `document`/`window` at setup() time still
// "works" there and the bug goes unnoticed until real SSR (renderToString in
// Node) breaks. This file overrides vitest's per-file environment to plain
// Node — no window, no document, no BOM globals at all — so it actually
// proves what happy-dom can't: that a component's setup() does not depend on
// a browser existing. See src/directives/tooltip.js's hasDocument() and
// src/components/RichTextDisplay.vue for the existing SSR-guard convention
// these tests are meant to guard.
import { test, expect } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createLx } from '@/lib';
import * as components from '@/components';

test('this file actually has no window/document (environment override is in effect)', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  // Not asserted here: sessionStorage/localStorage. Node 22+ ships a real
  // (in-memory, per-process, NOT per-browser-origin) global `sessionStorage`
  // by default, so `typeof sessionStorage !== 'undefined'` is no longer a
  // reliable "am I in a browser" check under SSR — it silently reads/writes
  // the wrong store instead of throwing. Guard on `typeof window` instead.
});

async function renderUnderSsr(component) {
  const app = createSSRApp({ render: () => h(component) });
  // Mirrors how a consuming app installs the library; getGlobals()-backed
  // code (e.g. Shell's getSystemId()) needs this to exist even during SSR.
  app.use(createLx, { systemId: 'ssr-audit', environment: 'test' });
  return renderToString(app);
}

const componentEntries = Object.entries(components);

// Sanity check on the audit itself: if this list were empty (e.g. the import
// shape of '@/components' changed), every test below would vacuously pass.
test('component export list used by the SSR audit is not empty', () => {
  expect(componentEntries.length).toBeGreaterThan(50);
});

test.each(componentEntries)(
  '%s: setup() does not throw for a missing browser global under SSR',
  async (name, component) => {
    try {
      await renderUnderSsr(component);
    } catch (err) {
      // A ReferenceError for "X is not defined" is exactly what happens when
      // setup() unconditionally touches document/window/localStorage/
      // sessionStorage/getComputedStyle/requestAnimationFrame/observers/etc
      // — the SSR-specific bug class this file exists to catch. Anything
      // else (a TypeError from missing required props, business-logic
      // access on empty data, a Vue prop-validation warning promoted to an
      // error, ...) is a mounting/usage concern unrelated to SSR-readiness,
      // and is not what this test is checking.
      if (/ is not defined$/.test(err?.message ?? '')) {
        throw new Error(
          `${name} accesses a browser global unconditionally during setup(), breaking SSR: ${err.message}`
        );
      }
    }
  }
);
