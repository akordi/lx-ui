/* eslint-disable no-underscore-dangle */
import { describe, test, expect } from 'vitest';
import { createApp } from 'vue';
import { createLx, lxPreloaded } from '@/lib';
import { shellModeComponents } from '@/components/shell/shellModeLoaders';

describe('createLx preload', () => {
  test('lxPreloaded resolves once the preloaded shell modes are loaded', async () => {
    createApp({}).use(createLx, { systemId: 'test', preload: { shellModes: ['public'] } });

    await lxPreloaded();

    expect(shellModeComponents.public.__asyncResolved).toBeTruthy();
    expect(shellModeComponents.default.__asyncResolved).toBeUndefined();
  });
});
