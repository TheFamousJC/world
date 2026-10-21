const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
fs.mkdirSync('test-results',{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{localStorage.setItem('escape-atlas:v1:tutorial','1');localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true}));});
  await p.goto((process.env.GAME_URL||'http://127.0.0.1:4186/world')+'/?test=1');
  await p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});await p.click('#story-back');await p.locator('#story-library [data-close]').click();
  const choose=async id=>{await p.click('#settings-button');await p.click('#settings-practice');await p.click(`[data-scenario="${id}"]`);};
  const plan=async to=>{await p.locator('.named-stop-picker').evaluate(e=>e.open=true);await p.selectOption('#destination',to);await p.waitForSelector('#transport-dialog[open]');await p.click('[data-transport="taxi"]');};
  const state=()=>p.evaluate(()=>window.escapeTest.getSession());
  await choose('last-departure');await plan('workshop');await plan('north');
  assert.equal(await p.inputValue('#travel-scope'),'all','Default Go still travels the entire plan');
  const all=await p.locator('#route-estimate').innerText();assert.match(all,/2 LEGS/);
  await p.selectOption('#travel-scope','1');assert.match(await p.locator('#route-estimate').innerText(),/SELECTED SECTION · 1 LEG/);
  assert.notEqual(await p.locator('#route-estimate').innerText(),all);
  await p.click('#clock-button');assert.equal(await p.locator('#go-button').isDisabled(),true);assert.equal(await p.locator('#play-status').innerText(),'PAUSED');await p.click('#clock-button');
  await p.click('#go-button');await p.waitForFunction(()=>window.escapeTest.getSession().game.phase==='arrived',null,{timeout:15000});
  assert.equal((await state()).game.position,'workshop');assert.equal((await state()).game.departures,1);assert.equal((await state()).plan.length,1);
  await p.click('#go-button');await p.waitForFunction(()=>window.escapeTest.getSession().game.position==='north',null,{timeout:15000});assert.equal((await state()).game.departures,2);
  await choose('papers-please');await plan('north');await p.click('#go-button');await p.waitForFunction(()=>window.escapeTest.getSession().game.position==='north',null,{timeout:15000});await plan('terespol');
  const cash=(await state()).game.cash;await p.click('#go-button');await p.waitForFunction(()=>document.getElementById('message').textContent.includes('clearance'));
  assert.equal((await state()).game.cash,cash);assert.equal(await p.locator('#go-button').isDisabled(),true);
  for(const width of [320,390,760]){
   await p.setViewportSize({width,height:844});await p.evaluate(()=>scrollTo(0,600));
   for(const id of ['go-button','route-estimate','message','active-objective','time-left'])assert.ok(await p.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.top>=0&&r.bottom<=innerHeight;}),id+' visible at '+width);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  }
  await p.setViewportSize({width:390,height:844});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'test-results/polish-mobile.png'});
  await p.setViewportSize({width:1526,height:866});await p.evaluate(()=>scrollTo(0,0));
  assert.equal(await p.locator('.route-panel #route-estimate').count(),1);assert.equal(await p.locator('.route-panel #message').count(),1);
  assert.ok(await p.locator('#go-button').evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight&&r.top>0;}));
  await p.screenshot({path:'test-results/polish-desktop.png'});assert.deepEqual(errors,[]);
  console.log('PASS: selected section honoured, matching quote, paused Go, onward leg, mobile error and objective, no failed-leg charge, phone/desktop layouts and Practice access.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
