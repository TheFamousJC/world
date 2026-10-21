const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const old=new Map();
for(const file of ['public/index.html','public/app.css','public/sw.js','src/app.js','src/mobile-layout.js']){
 let data=execFileSync('git',['show','8b2b878:'+file],{maxBuffer:4*1024*1024}).toString();
 if(file==='public/index.html')data=data.replace('content="development"','content="production"');
 if(file==='public/sw.js')data=data.replace('BUILD_ID','legacy-start-test').replace('REGION_REVISION','legacy-regions');
 old.set(file.replace(/^public\//,''),data);
}
let version='current';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json','.pbf':'application/x-protobuf','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 let rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/world\//,'')||'index.html';
 const file=path.resolve('dist',rel);if(!file.startsWith(path.resolve('dist')+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 let data=version==='legacy'&&old.has(rel)?old.get(rel):fs.readFileSync(file);
 if(rel==='update.html')data=data.toString().replace('./?v=0.13.2','./?v=0.13.2&test=1');
 if(version==='next'&&rel==='sw.js')data=data.toString().replace("const CACHE=PREFIX+'","const CACHE=PREFIX+'next-");
 if(version==='next'&&rel==='index.html')data=data.toString().replace('v0.13.2','v-test-next');
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
});
(async()=>{
 await new Promise(r=>server.listen(4188,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>localStorage.setItem('escape-atlas:v1:tutorial','1'));
  const base='http://127.0.0.1:4188/world/';
  const ready=()=>p.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});
  const state=()=>p.evaluate(()=>window.escapeTest.getSession());
  await p.goto(base+'?test=1');await ready();assert.equal((await state()).clockRunning,false);
  await p.click('#story-back');await p.locator('#story-library [data-close]').click();
  await p.click('#settings-button');await p.click('#settings-practice');await p.click('[data-scenario="last-departure"]');
  await p.locator('.named-stop-picker').evaluate(e=>e.open=true);await p.selectOption('#destination','workshop');await p.click('[data-transport="taxi"]');await p.click('#go-button');
  await p.waitForFunction(()=>window.escapeTest.getSession().game.phase==='travelling');
  await p.reload();await ready();assert.equal((await state()).clockRunning,false);assert.equal((await state()).game.phase,'travelling');
  const pending=await state();await p.waitForTimeout(2200);assert.deepEqual((await state()).game,pending.game,'Reload does not settle or run a pending leg');
  assert.equal(await p.locator('#clock-button').isDisabled(),false);
  await p.click('#settings-button');await p.check('#reduce-motion');await p.locator('#settings-dialog [data-close]').click();await p.click('#clock-button');
  await p.waitForFunction(()=>window.escapeTest.getSession().game.phase==='arrived');assert.equal((await state()).game.departures,1);
  await p.reload();await ready();const paused=await state();assert.equal(paused.clockRunning,false);await p.waitForTimeout(2200);assert.equal((await state()).game.elapsed,paused.game.elapsed);
  for(const width of [320,390,1526]){
   await p.setViewportSize({width,height:844});await p.evaluate(()=>scrollTo(0,0));
   for(const id of ['time-left','cash-left'])assert.ok(await p.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<380;}),id+' is at the top at '+width);
  }
  await p.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:60000});
  version='next';await p.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update()));
  await p.waitForSelector('#update-notice:not([hidden])',{timeout:60000});
  assert.equal(await p.locator('.version-label').innerText(),'v0.13.2','Installing an update does not silently reload');
  await p.click('#apply-update');await p.waitForFunction(()=>document.querySelector('.version-label')?.textContent==='v-test-next',null,{timeout:60000});await ready();
  assert.equal((await state()).clockRunning,false);assert.equal((await state()).game.cash,paused.game.cash);assert.equal((await state()).game.departures,1);
  await p.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:60000});
  assert.equal(await p.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>!!r?.waiting)),false);
  // A stale banner must still have a working link when no worker is waiting.
  await p.locator('#update-notice').evaluate(e=>e.hidden=false);
  await context.setOffline(true);const offlineUrl=p.url();await p.click('#apply-update');
  assert.equal(p.url(),offlineUrl);assert.match(await p.locator('#update-copy').innerText(),/Connect to the internet/);
  assert.equal((await state()).game.cash,paused.game.cash);
  await context.setOffline(false);version='current';await p.click('#apply-update');
  await p.waitForFunction(()=>document.querySelector('.version-label')?.textContent==='v0.13.2',null,{timeout:60000});await ready();
  assert.equal((await state()).clockRunning,false);assert.equal((await state()).game.cash,paused.game.cash);
  await context.close();
  version='legacy';const legacy=await browser.newContext({viewport:{width:390,height:844}}),q=await legacy.newPage();
  await legacy.addInitScript(()=>localStorage.setItem('escape-atlas:v1:tutorial','1'));
  await q.goto(base+'?test=1');await q.waitForFunction(()=>window.escapeTest?.atlas.ready,null,{timeout:60000});await q.click('#launch-story');
  await q.waitForFunction(()=>navigator.serviceWorker.controller);const before=await q.evaluate(()=>window.escapeTest.getSession().game);
  const regionalKey='escape-atlas:/world/:'+fs.readFileSync('dist/sw.js','utf8').match(/regions-[a-f0-9]+/)[0];await q.evaluate(async key=>{const c=await caches.open(key);await c.put('/world/preserved-map',new Response('saved map'));},regionalKey);
  version='current';await q.goto(base+'update.html');await q.waitForURL(/v=0.13.2/,{timeout:60000});
  await q.waitForFunction(()=>document.querySelector('.version-label')?.textContent==='v0.13.2'&&document.querySelector('#clock-button')?.textContent.includes('Resume'),null,{timeout:60000});
  assert.equal(await q.evaluate(()=>JSON.parse(localStorage.getItem('escape-atlas:v1:last')).game.cash),before.cash);
  assert.equal(await q.evaluate(async()=>!!await caches.match('/world/preserved-map')),true,'Recovery preserves downloaded map caches');
  await q.screenshot({path:'test-results/start-paused-mobile.png'});assert.deepEqual(errors,[]);
  console.log('PASS: fresh idle, reload paused, pending journey waits and settles once, top time/cash, explicit update without auto-reload, old-cache recovery preserves saves/maps.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
