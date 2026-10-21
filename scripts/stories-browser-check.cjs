const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
fs.mkdirSync('test-results',{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});try{
 const context=await browser.newContext({viewport:{width:1526,height:866}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true})));
 const base=process.env.GAME_URL||'http://127.0.0.1:4179';await p.goto(base+'/?test=1');await p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});
 const state=()=>p.evaluate(()=>window.escapeTest.getSession());
 await p.waitForSelector('#tutorial-dialog[open]');assert.equal((await state()).clockRunning,false);
 for(let i=0;i<5;i++){assert.match(await p.locator('#tutorial-step').innerText(),new RegExp((i+1)+' OF 6'));await p.click('#tutorial-next');}
 await p.click('#tutorial-back');assert.match(await p.locator('#tutorial-step').innerText(),/5 OF 6/);await p.click('#tutorial-next');await p.click('#tutorial-next');
 assert.equal(await p.locator('.story-card').count(),50);await p.screenshot({path:'test-results/story-library.png'});
 await p.selectOption('#story-region','world');assert.equal(await p.locator('.story-card').count(),40);await p.fill('#story-search','Osaka');assert.equal(await p.locator('.story-card').count(),5);await p.fill('#story-search','');await p.selectOption('#story-region','');
 // Every illustrated dossier renders its full five-operation / ten-mission plan.
 for(let i=1;i<=50;i++){const id='escape-'+String(i).padStart(2,'0');await p.click('[data-story="'+id+'"]');assert.equal(await p.locator('.chapter-list li').count(),5);assert.equal(await p.locator('#story-splash svg').count(),1);assert.ok((await p.locator('#story-splash-content').innerText()).includes('24 HOURS'));await p.click('#story-back');}
 await p.click('[data-story="escape-11"]');await p.screenshot({path:'test-results/story-briefing.png'});await p.click('#launch-story');assert.equal((await state()).game.scenarioId,'escape-11-op-1');assert.equal((await state()).clockRunning,true);
 const getScenario=()=>p.evaluate(()=>window.escapeTest.scenarios.find(c=>c.id===window.escapeTest.getSession().game.scenarioId));
 const visibleGo=async()=>{await p.screenshot({path:'test-results/story-game.png'});assert.ok(await p.locator('#go-button').evaluate(e=>{const r=e.getBoundingClientRect(),a=e.closest('.route-panel').getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom&&r.bottom<=innerHeight;}),'Go must remain visible');};
 async function leg(to,mode='taxi'){
  await p.locator('.named-stop-picker').evaluate(e=>e.open=true);await p.selectOption('#destination',to);await p.waitForSelector('#transport-dialog[open]');assert.ok(await p.locator('[data-transport="'+mode+'"]').count());await p.click('[data-transport="'+mode+'"]');await visibleGo();await p.click('#go-button');await p.waitForFunction(()=>window.escapeTest.getSession().game.phase!=='travelling',null,{timeout:10000});assert.equal((await state()).game.position,to,await p.locator('#message').innerText());
 }
 const point=id=>p.evaluate(id=>{const c=window.escapeTest.scenarios.find(c=>c.id===window.escapeTest.getSession().game.scenarioId);return [...new Set([c.start,c.goal,...c.detours.map(t=>t.place),...c.bonuses.map(t=>t.place)])].includes(id);},id);
 let flights=0,previousCash,previousElapsed;
 for(let stage=0;stage<5;stage++){
  const c=await getScenario();assert.equal(c.stage,stage);assert.equal(await p.locator('.mission-task').count(),2);assert.ok(await p.locator('.mission-task button').nth(1).isDisabled());
  for(const task of c.detours){
   const s=await state(),fromHub=s.game.position.split('-').slice(0,3).join('-'),toHub=task.place.split('-').slice(0,3).join('-');
   if(fromHub!==toHub){const departure=fromHub+'-5',arrival=toHub+'-5';if(s.game.position!==departure)await leg(departure);await leg(arrival,'flight');flights++;await p.screenshot({path:'test-results/flight-arrival.png'});}
   await leg(task.place);await p.click('[data-detour="'+task.id+'"]');assert.ok((await state()).game.completedTasks.includes(task.id));
  }
  // Cash and energy are optional and only award once. Both are in the arrival hub after operation 3.
  if(stage===0||stage===4){await p.locator('#bonus-panel').evaluate(e=>e.open=true);for(const b of c.bonuses){await leg(b.place);const before=(await state()).game;await p.click('[data-bonus="'+b.id+'"]');const after=(await state()).game;assert.equal(after.cash,before.cash+b.reward);assert.ok(after.energy>=before.energy);assert.equal(await p.locator('[data-bonus="'+b.id+'"]').isDisabled(),true);}await p.locator('#bonus-panel').evaluate(e=>e.open=false);}
  await leg(c.goal);const s=await state();assert.equal(s.game.phase,stage===4?'won':'checkpoint');assert.ok(s.game.elapsed<1440);
  if(stage<4){previousCash=s.game.cash;previousElapsed=s.game.elapsed;await p.click('#result-next');const next=await state();assert.equal(next.game.cash,previousCash);assert.ok(next.game.elapsed>=previousElapsed);assert.ok(next.game.elapsed<previousElapsed+1);}
 }
 assert.equal(flights,1);await p.screenshot({path:'test-results/story-complete.png'});await p.click('#result-dialog [data-close]');await p.click('#operation-button');await p.click('[data-story="escape-11"]');assert.match(await p.locator('#launch-story').innerText(),/Start 24-hour/);await p.click('#story-back');await p.click('[data-story="escape-01"]');await p.click('#launch-story');
 const c=await getScenario();await leg(c.detours[0].place,'walk');await p.click('[data-detour="'+c.detours[0].id+'"]');await p.click('#clock-button');const paused=await state();await p.waitForTimeout(1300);assert.equal((await state()).game.elapsed,paused.game.elapsed);await p.reload();await p.waitForFunction(()=>window.escapeTest?.atlas.ready);assert.equal((await state()).clockRunning,false);assert.equal((await state()).game.position,c.detours[0].place);
 await p.click('#operation-button');await p.click('[data-story="escape-11"]');assert.match(await p.locator('#story-splash').innerText(),/The Borrowed Phone/);
 const help=await context.newPage();await help.goto(base+'/help.html');assert.equal(await help.locator('.guide-steps li').count(),6);await help.goto(base+'/faq.html');assert.ok(await help.locator('details').count()>=12);
 if(await p.locator('meta[name="escape-build"]').getAttribute('content')==='production'){await p.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await p.reload();await p.waitForFunction(()=>window.escapeTest?.atlas.ready);assert.equal((await state()).game.scenarioId,'escape-01-op-1');await help.goto(base+'/help.html');assert.equal(await help.locator('.guide-steps li').count(),6);await help.goto(base+'/faq.html');assert.ok(await help.locator('details').count()>=12);await context.setOffline(false);console.log('World game, help and FAQ offline reload: PASS');}
 assert.deepEqual(errors,[]);console.log('Browser: wizard, all 50 briefings, search, five-operation world escape, flight terminals, optional rewards, carry-over, pause, reload, help and FAQ: PASS');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
