const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});try{
 const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.GAME_URL||'http://127.0.0.1:4175';
 const ready=async()=>{await page.waitForFunction(()=>window.escapeTest);await page.waitForSelector('.poi-marker',{timeout:60000});assert.equal(await page.locator('#map-fallback').isVisible(),false);};
 const state=()=>page.evaluate(()=>window.escapeTest.getSession());
 const choose=async id=>{await page.click('#challenges-button');assert.equal(await page.locator('.challenge-card').count(),10);await page.click(`[data-scenario="${id}"]`);};
 const add=async(to,mode)=>{await page.selectOption('#destination',to);await page.selectOption('#default-mode',mode);await page.click('#add-stop');};
 await page.goto(base+'/?test=1');await ready();await page.waitForTimeout(1200);await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
 assert.equal(await page.locator('[id*="profile"]').count(),0);
 await choose('wrong-bridge');await add('terespol','taxi');const before=(await state()).game;await page.click('#go-button');assert.match(await page.locator('#message').innerText(),/not possible/);const blocked=(await state()).game;assert.equal(blocked.cash,before.cash);assert.equal(blocked.elapsed,before.elapsed);assert.ok(await page.locator('#go-button').isDisabled());
 await page.click('#knowledge-button');await page.click('[data-action="local"]');assert.ok((await state()).game.cash<before.cash);await page.locator('#knowledge-dialog [data-close]').click();
 await choose('last-departure');await add('aid','taxi');await add('terespol','taxi');await page.click('#go-button');await page.waitForFunction(()=>window.escapeTest.getSession().game.phase==='travelling');const pending=(await state()).game;assert.ok(await page.locator('#go-button').isDisabled());
 await page.reload();await ready();await page.waitForFunction(()=>window.escapeTest.getSession().game.phase==='arrived',{timeout:60000});const arrived=(await state()).game;assert.equal(arrived.position,'aid');assert.equal(arrived.cash,pending.cash-pending.pending.cash);assert.ok(await page.locator('#go-button').isDisabled());assert.ok(await page.locator('#review-next').isVisible());await page.click('#clock-button');await page.reload();await ready();assert.equal((await state()).game.cash,arrived.cash);
 await page.click('#review-next');await page.click('#go-button');await page.waitForFunction(()=>window.escapeTest.getSession().game.phase==='won',{timeout:30000});assert.ok(await page.locator('#result-dialog').isVisible());await page.locator('#result-dialog [data-close]').click();
 await choose('wrong-bridge');assert.equal((await state()).game.cash,before.cash-2);
 for(const width of [390,320]){await page.setViewportSize({width,height:900});await page.click('#fit-region');await page.waitForTimeout(1100);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No horizontal overflow at ${width}px`);await page.screenshot({path:path.join(out,`mobile-${width}.png`),fullPage:true});}
 if(process.env.TEST_OFFLINE==='1'){await page.waitForFunction(()=>navigator.serviceWorker.controller,{timeout:60000});await page.waitForFunction(()=>document.getElementById('offline-status').textContent==='Offline map pack ready');await context.setOffline(true);await page.reload();await ready();assert.equal((await state()).game.scenarioId,'wrong-bridge');await context.setOffline(false);console.log('Offline reload: PASS');}
 assert.deepEqual(errors,[]);console.log('Browser: map, ten scenarios, closure, clues, departure lock, reload recovery, arrival review, win, saves, 390/320px layouts: PASS');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
