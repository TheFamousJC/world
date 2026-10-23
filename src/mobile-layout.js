// Move the real controls, preserving their state, IDs and delegated actions.
// Anchors restore the desktop layout when the viewport grows again.
export function setupMobileLayout() {
  // One shared column prevents field controls covering the departure button.
  const column = document.createElement('div');
  column.className = 'control-column';
  const route = document.querySelector('.route-panel');
  route.before(column);
  column.append(route, document.querySelector('.operations-dock'));
  const bar = document.createElement('section');
  bar.className = 'mobile-command-bar';
  bar.setAttribute('aria-label', 'Mission status and travel controls');
  bar.innerHTML = '<div class="mobile-status"></div><div class="mobile-actions"></div><div class="mobile-missions"></div>';
  document.querySelector('.app-header').after(bar);
  const targets = [
    ['.deadline-timers', '.mobile-status'], ['.resources', '.mobile-status'],
    ['#go-button', '.mobile-actions'], ['#clock-button', '.mobile-actions'],
    ['#travel-scope', '.mobile-actions'], ['#route-estimate', '.mobile-actions'],
    ['#message', '.mobile-actions'], ['#recovery-action', '.mobile-actions'], ['.play-context', '.mobile-missions'],
    ['#next-action', '.mobile-missions'], ['#operation-progress', '.mobile-missions'], ['#detour-panel', '.mobile-missions'],
    ['#continue-operation', '.mobile-missions']
  ].map(([selector, slot]) => {
    const element = document.querySelector(selector), anchor = document.createComment('desktop ' + selector);
    element.before(anchor);
    return {element, anchor, slot: bar.querySelector(slot)};
  });
  const mobile = matchMedia('(max-width: 1024px)');
  const update = () => {
    for (const {element, anchor, slot} of targets) {
      if (mobile.matches) slot.append(element);
      else anchor.after(element);
    }
  };
  mobile.addEventListener('change', update);
  update();
}
