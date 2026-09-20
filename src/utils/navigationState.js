let intendedRoute = null;

// Guarding on `window`, not `sessionStorage` directly — Node 22+ ships a
// real (in-memory, per-process) global `sessionStorage` by default, so
// checking it alone no longer reliably detects "is this a real browser".
// These run from router beforeEach/afterEach guards (see flowUtils.js),
// which fire during SSR too.
export function trackNavigationState(to) {
  if (typeof window === 'undefined') return;
  const notifyFlag = sessionStorage.getItem('version_update_notification');
  if (notifyFlag) return;
  intendedRoute = { name: to.name, params: to.params, query: to.query };
  sessionStorage.setItem('is_navigating', 'true');
  sessionStorage.setItem('intended_route', JSON.stringify(intendedRoute));
}

export function resetNavigationTracking() {
  if (typeof window === 'undefined') return;
  // A version reload is in flight - keep intended_route for restoreRouteAndNotify
  if (sessionStorage.getItem('version_reload_pending') === 'true') return;

  intendedRoute = null;
  sessionStorage.removeItem('is_navigating');
  sessionStorage.removeItem('intended_route');
}
