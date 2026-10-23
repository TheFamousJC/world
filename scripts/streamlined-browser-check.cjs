const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});try{
 const c=await b.newContext();await c.addInitScript(()=>{localStorage.setItem('escape-atlas:v1:tutorial','1');localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true}));});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.GAME_URL||'http://127.0.0.1:4187/world/')+'?test=1');await p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});await p.click('#launch-story');
 for(const [width,height] of [[1366,768],[820,1180],[390,844],[320,700]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(150);
  assert.equal(await p.locator('#go-button').isVisible(),false);
  assert.equal(await p.locator('#cash-left').isVisible(),false);
  assert.equal(await p.locator('#crossing-window').isVisible(),false);
  assert.equal(await p.locator('.missions-menu').getAttribute('open'),null);
  assert.equal(await p.locator('#detour-panel').isVisible(),false);
  assert.equal(await p.locator('.map-controls').isVisible(),false);
  assert.equal(await p.locator('.map-legend').isVisible(),false);
  const timer=p.locator('#clock-button');assert.ok(await timer.isVisible());assert.equal(await timer.getAttribute('aria-label'),'Pause game');
  await p.click('#map-view-button');assert.equal(await p.locator('#map-view-button').getAttribute('aria-expanded'),'true');assert.ok(await p.locator('.map-controls').isVisible());assert.ok(await p.locator('.map-legend').isVisible());
  await p.click('#layers-button');assert.ok(await p.locator('#layer-menu').isVisible());await p.click('#layers-button');
  await p.locator('.stop-key summary').click();assert.ok(await p.locator('.stop-key>div').isVisible());await p.locator('.stop-key summary').click();
  assert.ok(await p.locator('#map-view-menu').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight;}));
  await p.keyboard.press('Escape');assert.equal(await p.locator('#map-view-menu').isVisible(),false);
  await p.screenshot({path:`test-results/minimal-${width}.png`});
 }
 await p.locator('.missions-menu summary').click();await p.locator('#detour-panel [data-detour-travel]').first().click();assert.equal(await p.locator('.missions-menu').getAttribute('open'),null);assert.equal(await p.locator('#go-button').isVisible(),false);
 await p.click('[data-transport="taxi"]');assert.ok(await p.locator('#go-button').isVisible());await p.click('#go-button');await p.waitForFunction(()=>window.escapeTest.getSession().game.phase!=='travelling');
 assert.equal(await p.locator('#go-button').isVisible(),false);await p.locator('.missions-menu summary').click();await p.locator('#detour-panel [data-detour]').first().click();assert.equal((await p.evaluate(()=>window.escapeTest.getSession())).game.inventory.length,1);
 await p.click('#clock-button');assert.equal(await p.locator('#clock-button').getAttribute('aria-label'),'Resume game');const before=await p.evaluate(()=>window.escapeTest.getSession().game.elapsed);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>window.escapeTest.getSession().game.elapsed),before);assert.deepEqual(errors,[]);
 console.log('PASS minimal UI at four sizes; timer icons, collapsed missions, contextual Go, map options/layers/key, mission travel/collection and pause.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
