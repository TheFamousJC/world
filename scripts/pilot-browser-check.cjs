const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});try{
 const context=await b.newContext({viewport:{width:1526,height:866}});await context.addInitScript(()=>{localStorage.setItem('escape-atlas:v1:tutorial','1');localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true}));});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const base=process.env.GAME_URL||'http://127.0.0.1:4186/world';await p.goto(base+'/?test=1');await p.waitForFunction(()=>window.escapeTest?.atlas.ready);await p.click('#story-back');await p.click('.pilot-library-link');assert.match(await p.locator('#story-splash').innerText(),/NEW FIELD-DESK PILOT/);await p.click('#launch-story');
 await p.waitForFunction(()=>window.escapeTest.getSession().game.scenarioId==='escape-12-op-1',null,{timeout:90000});
 const state=()=>p.evaluate(()=>window.escapeTest.getSession());const config=()=>p.evaluate(()=>window.escapeTest.scenarios.find(c=>c.id===window.escapeTest.getSession().game.scenarioId));
 const close=()=>p.click('#field-desk-dialog [data-close]');
 async function desk(){await p.click('#field-desk');await p.waitForSelector('#field-desk-dialog[open]');}
 async function leg(to,mode='taxi'){
  if((await state()).game.position===to)return;
  await p.locator('.named-stop-picker').evaluate(e=>e.open=true);await p.selectOption('#destination',to);await p.click('[data-transport="'+mode+'"]');
  assert.ok(await p.locator('.route-leg.mode-'+mode).count());assert.match(await p.locator('#route-legs').innerText(),/ETA T\+/);
  const inView=await p.locator('#go-button').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});assert.ok(inView,'Go remains visible with the pilot panel');
  await p.click('#go-button');await p.waitForFunction(()=>window.escapeTest.getSession().game.phase!=='travelling',null,{timeout:15000});assert.equal((await state()).game.position,to,await p.locator('#message').innerText());
 }
 const solutions=[['F-17','KEY-42'],['Itami ITM','Landside terminal'],['Haneda HND','SK-318'],['G-04','Edition C'],['RED-8','Desk North']];
 async function clearDocument(stage){await desk();const before=(await state()).game;
  if(stage===0){await p.selectOption('[name=field0]','F-71');await p.selectOption('[name=field1]','KEY-24');await p.click('#document-form button');assert.match(await p.locator('#field-result').innerText(),/does not match/);assert.ok((await state()).game.elapsed>=before.elapsed+4);}
  for(let i=0;i<2;i++)await p.selectOption('[name=field'+i+']',solutions[stage][i]);await p.click('#document-form button');assert.match(await p.locator('#field-result').innerText(),/Clearance checked/);assert.ok((await state()).game.pilot.documents['escape-12-op-'+(stage+1)]);
  await p.screenshot({path:`test-results/pilot-document-${stage+1}.png`});await close();
 }
 let flight=false;
 for(let stage=0;stage<5;stage++){
  const c=await config();assert.equal(c.stage,stage);await desk();assert.match(await p.locator('.intel-card').innerText(),/Unverified/);
  const before=(await state()).game;await p.click('#verify-intel');assert.equal((await state()).game.cash,before.cash-2);assert.match(await p.locator('.intel-card').innerText(),/Dispatch confirmation/);assert.ok(await p.locator('#verify-intel').isDisabled());await close();
  for(const [i,task] of c.detours.entries()){
   const current=(await state()).game.position,fromHub=current.split('-').slice(0,3).join('-'),toHub=task.place.split('-').slice(0,3).join('-');
   if(fromHub!==toHub){await leg(fromHub+'-5');await leg(toHub+'-5','flight');flight=true;}
   await leg(task.place);await p.click('[data-detour="'+task.id+'"]');
   if(stage===2&&i===0)await clearDocument(stage);
  }
  if(stage!==2)await clearDocument(stage);
  if(stage===1){await desk();const elapsed=(await state()).game.elapsed;await p.click('#wait-service');assert.ok((await state()).game.elapsed>=elapsed+15);await close();}
  if(stage===3){await p.click('#clock-button');const before=await state();await p.waitForFunction(()=>navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await p.waitForFunction(()=>window.escapeTest?.atlas.ready&&window.escapeTest.network.regions.size===2,null,{timeout:60000});const after=await state();for(const key of ['cash','elapsed','energy'])assert.equal(after.game[key],before.game[key]);assert.deepEqual(after.game.pilot,before.game.pilot);assert.equal(after.clockRunning,false);await p.click('#clock-button');console.log('PASS pilot reports/documents/timetables restored offline');}
  await leg(c.goal);const end=(await state()).game;assert.equal(end.phase,stage===4?'won':'checkpoint');if(stage<4){await p.click('#result-next');const next=(await state()).game;assert.equal(next.cash,end.cash);assert.ok(next.elapsed>=end.elapsed&&next.elapsed<end.elapsed+.1);assert.ok(next.pilot.starts[next.scenarioId]>=end.elapsed&&next.pilot.starts[next.scenarioId]<end.elapsed+.1);}
 }
 assert.ok(flight);assert.equal(Object.keys((await state()).game.pilot.documents).length,5);await p.screenshot({path:'test-results/pilot-story-ending.png'});assert.deepEqual(errors,[]);console.log('PASS five-operation pilot: intelligence, document corrections, timetables, flight, waiting, visible Go, carry-over and offline ending');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
