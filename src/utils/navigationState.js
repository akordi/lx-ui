import { isClient } from '@vueuse/core';

let intendedRoute = null;

// Called from router guards (see flowUtils.js), which also run during SSR. Guard on `isClient`
// rather than `typeof sessionStorage`: Node 25+ exposes a process-wide Web Storage global.
export function trackNavigationState(to) {
  if (!isClient) return;
  const notifyFlag = sessionStorage.getItem('version_update_notification');
  if (notifyFlag) return;
  intendedRoute = { name: to.name, params: to.params, query: to.query };
  sessionStorage.setItem('is_navigating', 'true');
  sessionStorage.setItem('intended_route', JSON.stringify(intendedRoute));
}

export function resetNavigationTracking() {
  if (!isClient) return;
  // A version reload is in flight - keep intended_route for restoreRouteAndNotify
  if (sessionStorage.getItem('version_reload_pending') === 'true') return;

  intendedRoute = null;
  sessionStorage.removeItem('is_navigating');
  sessionStorage.removeItem('intended_route');
}
