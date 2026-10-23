// Reuse the actual controls so saved games and delegated game actions stay intact.
export function setupMobileLayout() {
 const left=document.querySelector('.mission-panel');
 const right=document.createElement('aside');
 right.className='mission-console';
 right.setAttribute('aria-label','Supplies and missions');
 document.querySelector('.play-area').append(right);
 right.append(document.querySelector('.resources'),document.querySelector('#detour-panel'),document.querySelector('#continue-operation'),document.querySelector('#knowledge-button'));
 // Keep the pause control beside its timer at every screen size.
 left.querySelector('.safety-deadline').append(document.querySelector('#clock-button'));
}
