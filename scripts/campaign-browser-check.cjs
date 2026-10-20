const {chromium}=require('C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:1526,height:866}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.GAME_URL||'http://127.0.0.1:4177')+'/?test=1');
 const ready=()=>p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000}),state=()=>p.evaluate(()=>window.escapeTest.getSession());
 await ready();await p.click('.region-beacon');await p.waitForTimeout(1900);assert.equal((await state()).game.scenarioId,'nightfall-1');
 const motion=async reduce=>{await p.click('#settings-button');await p.locator('#reduce-motion').setChecked(reduce);await p.click('#settings-dialog [data-close]');};await motion(true);
 const goVisible=()=>p.locator('#go-button').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.route-panel').getBoundingClientRect();return r.top>=p.top&&r.bottom<=p.bottom;});
 const layout=await p.evaluate(()=>['knowledge-button','rest-button','journal-button','restart-button','cash-left','energy-left'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,y:r.y,bottom:r.bottom};}));assert.ok(layout.every(r=>r.y>=0&&r.bottom<=866),JSON.stringify(layout));
 const leg=async(id,mode='taxi',watch=null)=>{
  if(watch)await motion(false);
  if(await p.locator('[data-detour-travel="'+id+'"]').count())await p.click('[data-detour-travel="'+id+'"]');else{await p.locator('.named-stop-picker').evaluate(e=>e.open=true);await p.selectOption('#destination',id);}
  await p.waitForSelector('#transport-dialog[open]');
  if(id==='biala'){assert.equal(await p.locator('[data-transport="taxi"]').count(),0);assert.match(await p.locator('[data-transport="walk"]').innerText(),/mandatory rest/);}
  await p.click('[data-transport="'+mode+'"]');assert.ok(await goVisible(),'Go stays in the visible panel');await p.click('#go-button');
  if(watch){
   await p.waitForFunction(text=>document.getElementById('travel-stage').textContent.startsWith(text),watch,{timeout:60000});
   const before=await state(),cash=before.game.cash,progress=await p.locator('#travel-progress').getAttribute('value'),time=await p.locator('#time-left').innerText(),energy=Number((await p.locator('#energy-left').innerText()).replace('%',''));
   assert.ok(before.game.pending[watch==='MANDATORY REST'?'restMinutes':'borderDelay']>0);await p.waitForTimeout(1200);
   assert.equal(await p.locator('#travel-progress').getAttribute('value'),progress,'Waiting holds map position');assert.notEqual(await p.locator('#time-left').innerText(),time,'Waiting spends simulated time');
   if(watch==='MANDATORY REST')assert.ok(Number((await p.locator('#energy-left').innerText()).replace('%',''))>energy,'Rest restores visible energy');
   await p.screenshot({path:watch==='MANDATORY REST'?'test-results/mandatory-recovery.png':'test-results/border-control.png',fullPage:true});
   await motion(true);await p.reload();await ready();await p.waitForFunction(()=>['arrived','checkpoint','won'].includes(window.escapeTest.getSession().game.phase),null,{timeout:60000});
   assert.equal((await state()).game.cash,cash-before.game.pending.cash,'Reload charges once');
  }else await p.waitForFunction(()=>['arrived','checkpoint','won'].includes(window.escapeTest.getSession().game.phase),null,{timeout:60000});
 };
 const stages=[{tasks:[['aid','dispatch']],goal:'terespol'},{tasks:[['lodge','supplies']],goal:'koroszczyn'},{tasks:[['lodge','route-card']],goal:'kobylany'},{tasks:[['terespol','confirm']],goal:'malaszewicze'},{tasks:[['chotylow','relay']],goal:'zalesie'},{tasks:[['malaszewicze','emergency-cash']],goal:'central',watch:'BORDER CONTROL'},{tasks:[['workshop','passport-pickup']],goal:'koroszczyn'},{tasks:[['kobylany','sealed-package'],['zalesie','evac-supplies']],goal:'biala',mode:'walk',watch:'MANDATORY REST'}];
 for(let i=0;i<stages.length;i++){
  const c=stages[i];assert.equal(await p.locator('#operation-progress').innerText(),'OPERATION NIGHTFALL / SECTION '+(i+1)+' OF 8');
  for(const [place,task] of c.tasks){await leg(place);await p.click('[data-detour="'+task+'"]');assert.ok((await state()).game.completedTasks.includes(task));}
  await leg(c.goal,c.mode||'taxi',c.watch);
  if(i<stages.length-1){const before=await state();await p.locator('#result-dialog [data-close]').click();await p.waitForTimeout(1100);assert.ok((await state()).game.elapsed>before.game.elapsed);await p.click('#clock-button');const paused=await state();await p.click('#continue-operation');await p.waitForTimeout(500);const after=await state();assert.equal(after.clockRunning,false);assert.equal(after.game.elapsed,paused.game.elapsed);assert.equal(after.game.cash,paused.game.cash);await p.click('#clock-button');}
 }
 assert.equal((await state()).game.phase,'won');assert.ok((await state()).game.inventory.includes('passport'));assert.ok((await state()).game.inventory.includes('sealed package'));await p.locator('#result-dialog [data-close]').click();await p.screenshot({path:'test-results/eight-stage-complete.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: all eight sections, required pickups, inventory, 45m border control animation, mandatory rest animation, energy recovery, pause, pending reload and exactly-once charges.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
