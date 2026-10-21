const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});try{
 const context=await browser.newContext({viewport:{width:1526,height:866}}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{localStorage.setItem('escape-atlas:v1:tutorial','1');localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true}));});
 const base=process.env.GAME_URL||'http://127.0.0.1:4179';await p.goto(base+'/?test=1');await p.waitForFunction(()=>window.escapeTest?.atlas.ready);
 await p.click('#story-back');
 const state=()=>p.evaluate(()=>window.escapeTest.getSession());
 async function leg(to,mode){await p.locator('.named-stop-picker').evaluate(e=>e.open=true);await p.selectOption('#destination',to);await p.waitForSelector('#transport-dialog[open]');await p.click('[data-transport="'+mode+'"]');await p.click('#go-button');await p.waitForFunction(()=>window.escapeTest.getSession().game.phase!=='travelling',null,{timeout:65000});assert.equal((await state()).game.position,to,await p.locator('#message').innerText());}
 for(let corridor=0;corridor<8;corridor++){
  if(corridor)await p.click('#operation-button');
  const id='escape-'+String(11+corridor*5).padStart(2,'0');await p.click('[data-story="'+id+'"]');await p.click('#launch-story');
  await p.waitForFunction(id=>window.escapeTest.getSession().game.scenarioId===id+'-op-1',id,{timeout:90000});
  const departure=`world-${corridor}-0-5`,arrival=`world-${corridor}-1-5`;
  await p.waitForFunction(()=>{const x=window.escapeTest;return x.network.regions.size===2&&x.atlas.map.isSourceLoaded('region')&&x.atlas.map.queryRenderedFeatures({layers:['roads-fill']}).length>50;},null,{timeout:60000});
  await p.screenshot({path:`test-results/world-${corridor}-departure.png`});
  await leg(departure,'taxi');
  if(corridor===0){await p.click('#settings-button');await p.uncheck('#reduce-motion');await p.click('#settings-dialog [data-close]');}
  await leg(arrival,'flight');
  await p.waitForFunction(hub=>{const x=window.escapeTest,m=x.atlas.map,c=m.getCenter(),a=x.atlas.find(x.getSession().game.position).coordinates;return x.atlas.regionKey===hub&&Math.abs(c.lng-a[0])<.002&&Math.abs(c.lat-a[1])<.002&&m.getZoom()>=13&&m.isSourceLoaded('region')&&m.queryRenderedFeatures({layers:['roads-fill']}).length>30;},`world-${corridor}-1`,{timeout:30000});
  if(corridor===0){await p.click('#settings-button');await p.check('#reduce-motion');await p.click('#settings-dialog [data-close]');}
  await p.click('#clock-button');const before=(await state()).game;
  await p.screenshot({path:`test-results/world-${corridor}-arrival.png`});
  await p.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:30000});await context.setOffline(true);await p.reload();
  await p.waitForFunction(()=>window.escapeTest?.atlas.ready&&window.escapeTest.network.regions.size===2,null,{timeout:60000});
  const after=await state();assert.equal(after.clockRunning,false);for(const key of ['cash','energy','elapsed','position'])assert.equal(after.game[key],before[key]);
  await p.waitForFunction(()=>{const x=window.escapeTest,m=x.atlas.map,c=m.getCenter(),a=x.atlas.find(x.getSession().game.position).coordinates;return Math.abs(c.lng-a[0])<.002&&Math.abs(c.lat-a[1])<.002&&m.getZoom()>=13;});
  await context.setOffline(false);console.log(`PASS corridor ${corridor}: both detailed maps, road transfer, flight camera, offline packs/save reload`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
