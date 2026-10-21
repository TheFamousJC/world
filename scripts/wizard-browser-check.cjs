const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
 try{
  for(const width of [320,390,1526]){
   const context=await browser.newContext({viewport:{width,height:740}}),p=await context.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto((process.env.GAME_URL||'http://127.0.0.1:4186/world')+'/?test=1');
   await p.waitForSelector('#tutorial-dialog[open]',{timeout:60000});
   const count=await p.locator('#tutorial-progress i').count();assert.equal(count,12);
   for(let step=1;step<=count;step++){
    assert.match(await p.locator('#tutorial-step').innerText(),new RegExp(step+' OF '+count));
    assert.equal(await p.evaluate(()=>window.escapeTest.getSession().clockRunning),false);
    assert.ok((await p.locator('#tutorial-text').innerText()).length>80);
    assert.ok(await p.locator('#tutorial-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),'Wizard fits phone width');
    await p.click('#tutorial-next');
   }
   assert.equal(await p.locator('.story-card').count(),50);
   assert.equal(await p.evaluate(()=>localStorage.getItem('escape-atlas:v1:tutorial')),'1');
   await p.locator('.story-library [data-close]').click();
   await p.click('#tutorial-button');
   assert.match(await p.locator('#tutorial-step').innerText(),/1 OF 12/);
   await p.click('#tutorial-next');await p.click('#tutorial-back');
   assert.match(await p.locator('#tutorial-step').innerText(),/1 OF 12/);
   await p.click('#tutorial-skip');assert.equal(await p.locator('#story-library').isVisible(),true);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS: all 12 wizard pages, paused first-time clock, back/next/skip/replay, library and saved completion at 320/390/1526px.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
