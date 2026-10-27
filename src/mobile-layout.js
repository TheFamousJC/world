// Keep game controls intact while presenting only the controls needed now.
export function setupMobileLayout() {
 const stack=document.createElement('div');
 stack.className='left-console-stack';
 document.querySelector('.play-area').append(stack);
 // Keep contact actions outside the map's stacking context, above the console.
 document.querySelector('.play-area').append(document.querySelector('#place-card'));
 const missions=document.createElement('details');
 missions.className='missions-menu';
 missions.innerHTML='<summary>Missions <span id="mission-menu-count"></span></summary><div class="missions-content"></div>';
 const content=missions.querySelector('div');
  content.append(document.querySelector('#operation-progress'),document.querySelector('.objective'),document.querySelector('#detour-panel'),document.querySelector('#continue-operation'),document.querySelector('#knowledge-button'));
 const section=(title,elements)=>{
  const details=document.createElement('details');details.className='mission-tools';
  const label=document.createElement('summary');label.textContent=title;details.append(label,...elements);content.append(details);
 };
 section('Planned route',[document.querySelector('#route-legs'),document.querySelector('#travel-scope'),document.querySelector('#route-estimate')]);
 section('Supplies & recovery',[document.querySelector('#bonus-panel'),document.querySelector('#rest-button'),document.querySelector('#inventory')]);
 section('Briefing & journey',[document.querySelector('#mission-title'),document.querySelector('#mission-subtitle'),document.querySelector('#briefing-button'),document.querySelector('#restart-button'),document.querySelector('#journal-button')]);
 section('Help & settings',[document.querySelector('#tutorial-button'),document.querySelector('#settings-button'),document.querySelector('#challenges-button')]);
 stack.append(document.querySelector('.mission-panel'),document.querySelector('.resources'),missions,document.querySelector('.route-panel'));
 const view=document.createElement('button');
 view.id='map-view-button';view.className='button secondary';view.textContent='Map view';
 view.setAttribute('aria-expanded','false');view.setAttribute('aria-controls','map-view-menu');
 document.querySelector('#operation-button').after(view);
 const menu=document.createElement('section');
 menu.id='map-view-menu';menu.className='map-view-menu';menu.hidden=true;
 menu.setAttribute('aria-label','Map view options');
 menu.append(document.querySelector('.map-controls'),document.querySelector('#world-map-note'),document.querySelector('#layer-menu'));
 const key=document.querySelector('.map-legend');
 const sizeKey=()=>document.documentElement.style.setProperty('--map-key-height',key.getBoundingClientRect().height+'px');
 new ResizeObserver(sizeKey).observe(key);
 sizeKey();
 document.querySelector('#app').append(menu);
 const close=()=>{menu.hidden=true;view.setAttribute('aria-expanded','false');};
 view.addEventListener('click',()=>{menu.hidden=!menu.hidden;view.setAttribute('aria-expanded',String(!menu.hidden));});
 document.addEventListener('click',e=>{
  if(!view.contains(e.target)&&!menu.contains(e.target))close();
  if(e.target.closest('[data-detour-travel],[data-go-contact],[data-detour],[data-locate-mission]'))missions.open=false;
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){close();view.focus();}});
}
