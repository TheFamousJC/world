const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
fs.mkdirSync('test-results',{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});try{
 const context=await b.newContext({viewport:{width:820,height:1180}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{localStorage.setItem('escape-atlas:v1:tutorial','1');localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true}));});
 await p.goto((process.env.GAME_URL||'http://127.0.0.1:4187/world')+'/?test=1');await p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});await p.click('#launch-story');
 const state=()=>p.evaluate(()=>window.escapeTest.getSession());
 const config=()=>p.evaluate(()=>{const x=window.escapeTest;return x.scenarios.find(c=>c.id===x.getSession().game.scenarioId);});
 const arrived=()=>p.waitForFunction(()=>window.escapeTest.getSession().game.phase!=='travelling',null,{timeout:15000});
 const depart=async()=>{await p.click('[data-transport="taxi"]');assert.ok(await p.locator('#go-button').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));await p.click('#go-button');await arrived();};
 const sizes=[{width:820,height:1180},{width:1024,height:1366},{width:1366,height:1024},{width:820,height:1180},{width:390,height:844}];
 for(let stage=0;stage<5;stage++){
  await p.setViewportSize(sizes[stage]);const cfg=await config();assert.equal(cfg.id,'escape-01-op-'+(stage+1));
  assert.equal(await p.locator('.operation-track li').count(),5);assert.equal(await p.locator('.operation-track [aria-current=step]').innerText(),String(stage+1));assert.equal(await p.locator('.operation-track .complete').count(),stage);
  if(sizes[stage].width<=1024){assert.equal(await p.locator('.mobile-command-bar #next-action').count(),1);assert.ok(await p.locator('.map-legend').evaluate(e=>e.getBoundingClientRect().width>250),'Portrait key has room to be readable');}
  else assert.equal(await p.locator('.route-panel #next-action').count(),1);
  // Optional supplies remain optional and do not replace either required mission.
  await p.locator('.named-stop-picker').evaluate(e=>e.open=true);await p.selectOption('#destination',cfg.bonuses[0].place);await depart();
  await p.click('#place-actions [data-contact-bonus="'+cfg.bonuses[0].id+'"]');assert.equal((await state()).game.completedTasks.includes(cfg.detours[0].id),false);
  for(const [i,t] of cfg.detours.entries()){
   assert.match(await p.locator('#next-action').innerText(),new RegExp('Plan route to mission '+(i+1)));
   await p.click('#next-action');await depart();assert.equal((await state()).game.position,t.place);assert.equal(await p.locator('#next-action').innerText(),t.title);
   if(stage===1&&i===0){await p.click('#clock-button');const before=(await state()).game;await p.reload();await p.waitForFunction(()=>window.escapeTest?.atlas.ready);assert.equal(await p.locator('#next-action').innerText(),'Resume game');assert.equal((await state()).game.cash,before.cash);assert.equal((await state()).game.elapsed,before.elapsed);await p.click('#next-action');assert.equal(await p.locator('#next-action').innerText(),t.title);}
   await p.click('#next-action');assert.ok((await state()).game.completedTasks.includes(t.id));
  }
  assert.equal(await p.locator('#next-action').innerText(),'Plan route to destination');assert.equal(await p.locator('#place-actions [data-contact-plan="'+cfg.goal+'"]').count(),1);
  await p.waitForFunction(()=>window.escapeTest.atlas.map.queryRenderedFeatures({layers:['roads-fill']}).length>0,null,{timeout:60000});await p.screenshot({path:'test-results/nightfall-op-'+(stage+1)+'-'+sizes[stage].width+'.png'});
  if(stage===3&&await p.locator('meta[name=escape-build]').getAttribute('content')==='production'){
   await p.click('#clock-button');await p.waitForFunction(()=>navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await p.waitForFunction(()=>window.escapeTest?.atlas.ready);await p.click('#next-action');assert.equal(await p.locator('#next-action').innerText(),'Plan route to destination');
  }
  await p.click('#next-action');await depart();assert.equal((await state()).game.phase,stage===4?'won':'checkpoint');
  if(stage<4){const before=(await state()).game;assert.match(await p.locator('#result-next').innerText(),new RegExp('operation '+(stage+2)));await p.locator('#result-dialog [data-close]').click();assert.match(await p.locator('#next-action').innerText(),/Continue to operation/);await p.click('#next-action');const after=(await state()).game;assert.equal(after.cash,before.cash);assert.equal(after.energy,before.energy);assert.deepEqual(after.inventory,before.inventory);assert.ok(after.elapsed>=before.elapsed&&after.elapsed<before.elapsed+.1);}
 }
 assert.equal((await state()).game.inventory.length,10);assert.match(await p.locator('#result-title').innerText(),/Nightfall.*complete/);assert.equal(await p.locator('#result-next').innerText(),'Next story →');assert.deepEqual(errors,[]);
 console.log('PASS Nightfall: all five operations using next-step actions, ten items, optional cash, portrait/landscape/phone layouts, progress rail, paused reload, offline finish and exact resource carry-over.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
