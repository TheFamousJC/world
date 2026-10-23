// Keep game controls intact while presenting only the controls needed now.
export function setupMobileLayout() {
 const stack=document.createElement('div');
 stack.className='left-console-stack';
 document.querySelector('.play-area').append(stack);
 const missions=document.createElement('details');
 missions.className='missions-menu';
 missions.innerHTML='<summary>Missions</summary><div class="missions-content"></div>';
 const content=missions.querySelector('div');
 content.append(document.querySelector('#detour-panel'),document.querySelector('#continue-operation'),document.querySelector('#knowledge-button'));
 stack.append(document.querySelector('.mission-panel'),document.querySelector('.resources'),missions,document.querySelector('.route-panel'));
 const view=document.createElement('button');
 view.id='map-view-button';view.className='button secondary';view.textContent='Map view';
 view.setAttribute('aria-expanded','false');view.setAttribute('aria-controls','map-view-menu');
 document.querySelector('#operation-button').after(view);
 const menu=document.createElement('section');
 menu.id='map-view-menu';menu.className='map-view-menu';menu.hidden=true;
 menu.setAttribute('aria-label','Map view options');
 menu.append(document.querySelector('.map-controls'),document.querySelector('#layer-menu'),document.querySelector('.map-legend'));
 document.querySelector('#app').append(menu);
 const close=()=>{menu.hidden=true;view.setAttribute('aria-expanded','false');};
 view.addEventListener('click',()=>{menu.hidden=!menu.hidden;view.setAttribute('aria-expanded',String(!menu.hidden));});
 document.addEventListener('click',e=>{
  if(!view.contains(e.target)&&!menu.contains(e.target))close();
  if(e.target.closest('[data-detour-travel],[data-go-contact],[data-detour]'))missions.open=false;
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){close();view.focus();}});
}
