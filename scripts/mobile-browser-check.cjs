const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{localStorage.setItem('escape-atlas:v1:tutorial','1');localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true}));});
  await p.goto((process.env.GAME_URL||'http://127.0.0.1:4186/world')+'/?test=1');
  await p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});
  await p.click('#launch-story');
  await p.waitForFunction(()=>window.escapeTest.getSession().clockRunning);
  for(const width of [390,320,760]){
   await p.setViewportSize({width,height:844});
   for(const scroll of [0,800]){
    await p.evaluate(y=>scrollTo(0,y),scroll);
    for(const id of ['go-button','time-left','cash-left','energy-left','crossing-countdown','detour-panel']){
     assert.ok(await p.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;}),id+' stays visible at '+width);
    }
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal scroll');
   }
  }
  await p.setViewportSize({width:390,height:844});await p.evaluate(()=>scrollTo(0,0));
  await p.click('#clock-button');assert.equal(await p.evaluate(()=>window.escapeTest.getSession().clockRunning),false);
  await p.click('#clock-button');
  await p.locator('.mobile-missions [data-detour-travel]').first().click();
  await p.waitForSelector('#transport-dialog[open]');await p.click('[data-transport="taxi"]');
  assert.equal(await p.locator('#go-button').isDisabled(),false);
  const before=await p.evaluate(()=>window.escapeTest.getSession().game);
  await p.click('#go-button');
  await p.waitForFunction(()=>window.escapeTest.getSession().game.phase==='arrived',null,{timeout:15000});
  const after=await p.evaluate(()=>window.escapeTest.getSession().game);
  assert.equal(after.departures,before.departures+1);assert.ok(after.cash<before.cash);
  await p.locator('.mobile-missions [data-detour]').first().click();
  assert.equal(await p.evaluate(()=>window.escapeTest.getSession().game.completedTasks.length),1);
  await p.screenshot({path:'test-results/mobile-command-bar.png'});
  await p.setViewportSize({width:1526,height:866});
  assert.equal(await p.locator('.route-panel #go-button').count(),1);
  assert.equal(await p.locator('.mission-panel #time-left').count(),1);
  assert.equal(await p.locator('.route-panel #detour-panel').count(),1);
  assert.equal(await p.locator('.mobile-command-bar').isVisible(),false);
  await p.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:60000});
  await context.setOffline(true);await p.reload();
  await p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});
  await p.setViewportSize({width:390,height:844});
  assert.equal(await p.locator('.mobile-command-bar #go-button').count(),1);
  assert.equal(await p.evaluate(()=>window.escapeTest.getSession().game.completedTasks.length),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: sticky mobile controls at 320/390/760px, pause, plan, travel, single charge, collect mission, desktop restoration.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
