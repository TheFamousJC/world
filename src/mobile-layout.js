// Move the real controls, preserving their state, IDs and delegated actions.
// Anchors restore the desktop layout when the viewport grows again.
export function setupMobileLayout() {
  const bar = document.createElement('section');
  bar.className = 'mobile-command-bar';
  bar.setAttribute('aria-label', 'Mission status and travel controls');
  bar.innerHTML = '<div class="mobile-status"></div><div class="mobile-actions"></div><div class="mobile-missions"></div>';
  document.querySelector('.app-header').after(bar);
  const targets = [
    ['.deadline-timers', '.mobile-status'], ['.resources', '.mobile-status'],
    ['#go-button', '.mobile-actions'], ['#clock-button', '.mobile-actions'],
    ['#travel-scope', '.mobile-actions'],
    ['#operation-progress', '.mobile-missions'], ['#detour-panel', '.mobile-missions'],
    ['#continue-operation', '.mobile-missions']
  ].map(([selector, slot]) => {
    const element = document.querySelector(selector), anchor = document.createComment('desktop ' + selector);
    element.before(anchor);
    return {element, anchor, slot: bar.querySelector(slot)};
  });
  const mobile = matchMedia('(max-width: 760px)');
  const update = () => {
    for (const {element, anchor, slot} of targets) {
      if (mobile.matches) slot.append(element);
      else anchor.after(element);
    }
  };
  mobile.addEventListener('change', update);
  update();
}
