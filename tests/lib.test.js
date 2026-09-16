import { describe, test, expect } from 'vitest';
import { createApp } from 'vue';
import { createLx, vTooltip, closeTooltip } from '@/lib';

describe('createLx', () => {
  // Registration must precede install()'s preload early-return, or a plugin call without
  // `preload` would silently register nothing
  test('registers the tooltip directive when no preload option is given', () => {
    const app = createApp({ template: '<div />' });
    app.use(createLx, { systemId: 'test', environment: 'test' });

    expect(app.directive('tooltip')).toBe(vTooltip);
  });

  test('re-exports the directive helpers', () => {
    expect(typeof closeTooltip).toBe('function');
    expect(vTooltip.mounted).toBeTypeOf('function');
  });
});
