const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});try{
 const c=await b.newContext();await c.addInitScript(()=>{localStorage.setItem('escape-atlas:v1:tutorial','1');localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true}));});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.GAME_URL||'http://127.0.0.1:4187/world/')+'?test=1');await p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});await p.click('#launch-story');
 await p.setViewportSize({width:1366,height:768});
 const centre=await p.evaluate(()=>{const x=window.escapeTest,c=x.scenarios.find(c=>c.id===x.getSession().game.scenarioId);return x.atlas.markers.get(c.detours[0].place).marker.getLngLat().toArray();});
 for(const zoom of [8,9,13]){
  await p.evaluate(({centre,zoom})=>window.escapeTest.atlas.map.jumpTo({center:centre,zoom}),{centre,zoom});
  await p.waitForTimeout(100);
  assert.deepEqual((await p.locator('.mission-stop .mission-badge').allTextContents()).sort(),['1','2']);
  for(const badge of await p.locator('.mission-stop .mission-badge').all())assert.ok(await badge.isVisible(),'Amber badge stays visible at zoom '+zoom);
  await p.evaluate(()=>window.escapeTest.atlas.setLayer('places',false));assert.equal(await p.locator('.mission-stop:visible').count(),0);
  await p.evaluate(()=>window.escapeTest.atlas.setLayer('places',true));assert.equal(await p.locator('.mission-stop:visible').count(),2);
 }
 await p.screenshot({path:'test-results/desktop-mission-badges.png'});

 for(const [width,height] of [[1366,768],[820,1180],[390,844],[320,700]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(150);
  assert.equal(await p.locator('#go-button').isVisible(),false);
  assert.ok(await p.locator('#cash-left').isVisible());assert.ok(await p.locator('#energy-left').isVisible());assert.ok(await p.locator('.left-console-stack').evaluate(e=>{const t=e.querySelector('.mission-panel').getBoundingClientRect(),r=e.querySelector('.resources').getBoundingClientRect(),m=e.querySelector('.missions-menu').getBoundingClientRect();return r.top>=t.bottom&&m.top>=r.bottom;}),'Money and energy sit between timer and missions');
  assert.equal(await p.locator('#crossing-window').isVisible(),false);
  assert.equal(await p.locator('.missions-menu').getAttribute('open'),null);
  assert.equal(await p.locator('#detour-panel').isVisible(),false);
  await p.locator('.missions-menu > summary').click();
  assert.equal(await p.locator('#detour-panel .mission-task').count(),2);
  assert.equal(await p.locator('#mission-menu-count').innerText(),'0/2');
  assert.ok(await p.locator('#mission-goal').isVisible());assert.ok(await p.locator('#operation-progress').isVisible());
  await p.locator('.mission-tools > summary').filter({hasText:'Supplies & recovery'}).click();
  assert.ok(await p.locator('#rest-button').isVisible());assert.ok(await p.locator('#bonus-panel').isVisible());
  await p.locator('.mission-tools > summary').filter({hasText:'Supplies & recovery'}).click();
  await p.locator('.mission-tools > summary').filter({hasText:'Briefing & journey'}).click();assert.ok(await p.locator('#briefing-button').isVisible());assert.ok(await p.locator('#journal-button').isVisible());
  await p.locator('.mission-tools > summary').filter({hasText:'Briefing & journey'}).click();
  await p.locator('.mission-tools > summary').filter({hasText:'Help & settings'}).click();await p.click('#settings-button');assert.ok(await p.locator('#settings-dialog').isVisible());await p.locator('#settings-dialog [data-close]').click();
  await p.locator('.mission-tools > summary').filter({hasText:'Help & settings'}).click();await p.locator('.missions-menu > summary').click();
  assert.equal(await p.locator('.map-controls').isVisible(),false);
  assert.ok(await p.locator('.map-legend').isVisible());assert.ok(await p.locator('.map-legend').evaluate(e=>{const r=e.getBoundingClientRect();return Math.abs(r.left)<1&&Math.abs(r.width-innerWidth)<2&&r.bottom<=innerHeight;}),'Key fits the full screen width');
  const timer=p.locator('#clock-button');assert.ok(await timer.isVisible());assert.equal(await timer.getAttribute('aria-label'),'Pause game');
  await p.click('#map-view-button');assert.equal(await p.locator('#map-view-button').getAttribute('aria-expanded'),'true');assert.ok(await p.locator('.map-controls').isVisible());assert.ok(await p.locator('.map-legend').isVisible());
  await p.click('#layers-button');assert.ok(await p.locator('#layer-menu').isVisible());await p.click('#layers-button');
  await p.locator('.stop-key summary').click();assert.ok(await p.locator('.stop-key>div').isVisible());await p.locator('.stop-key summary').click();
  assert.ok(await p.locator('#map-view-menu').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight;}));
  await p.keyboard.press('Escape');assert.equal(await p.locator('#map-view-menu').isVisible(),false);
  await p.screenshot({path:`test-results/minimal-${width}.png`});
 }
 await p.locator('.missions-menu > summary').click();await p.locator('#detour-panel [data-detour-travel]').first().click();assert.equal(await p.locator('.missions-menu').getAttribute('open'),null);assert.equal(await p.locator('#go-button').isVisible(),false);
 await p.click('[data-transport="taxi"]');await p.locator('.missions-menu > summary').click();await p.locator('.mission-tools > summary').filter({hasText:'Planned route'}).click();assert.ok(await p.locator('#route-estimate').isVisible());assert.ok(await p.locator('#travel-scope').isVisible());assert.equal(await p.locator('#route-legs .route-leg').count(),1);await p.locator('.missions-menu > summary').click();assert.ok(await p.locator('.map-legend').isVisible());assert.ok(await p.locator('#go-button').isVisible());await p.click('#go-button');await p.waitForFunction(()=>window.escapeTest.getSession().game.phase!=='travelling');
 assert.equal(await p.locator('#go-button').isVisible(),false);await p.locator('.missions-menu > summary').click();await p.locator('#detour-panel [data-detour]').first().click();assert.equal((await p.evaluate(()=>window.escapeTest.getSession())).game.inventory.length,1);assert.equal(await p.locator('#place-actions [data-contact-plan],#place-actions [data-contact-go],#place-actions [data-repair-contact]').count(),0,'Collection does not suggest or launch the next route');assert.match(await p.locator('#place-note').innerText(),/Collected/);assert.equal(await p.locator('#mission-menu-count').innerText(),'1/2');assert.equal(await p.locator('.mission-stop.pickup-collected .mission-badge').innerText(),'1✓');assert.equal((await p.evaluate(()=>window.escapeTest.getSession())).plan.length,0,'Collection leaves the next destination to the player');
 await p.click('#clock-button');assert.equal(await p.locator('#clock-button').getAttribute('aria-label'),'Resume game');const before=await p.evaluate(()=>window.escapeTest.getSession().game.elapsed);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>window.escapeTest.getSession().game.elapsed),before);assert.deepEqual(errors,[]);
 console.log('PASS minimal UI at four sizes; timer icons, collapsed missions, contextual Go, map options/layers/key, mission travel/collection and pause.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
