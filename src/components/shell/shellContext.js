import { computed, inject } from 'vue';
import useLx from '@/hooks/useLx';
import { logError } from '@/utils/devUtils';

export const shellContextKey = Symbol('shellContext');

export function useShellContext() {
  const shellContext = inject(shellContextKey, null);

  if (!shellContext) {
    logError('LxShell: Shell context is not available', useLx().getGlobals()?.environment);
    return {};
  }

  return shellContext;
}

export function useGlobalSearchPlacement() {
  const shellContext = inject(shellContextKey, null);
  return {
    hasGlobalSearch: computed(() => !!shellContext?.props?.hasGlobalSearch),
    canMoveToNav: computed(() => !!shellContext?.globalSearchCanMoveToNav?.value),
    inNav: computed(() => !!shellContext?.globalSearchInNav?.value),
  };
}
