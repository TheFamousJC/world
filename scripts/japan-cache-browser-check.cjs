const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_NODE_PATH||'C:/Users/jdcar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('dist');let upgraded=false;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.geojson':'application/geo+json','.json':'application/json','.pbf':'application/x-protobuf','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/world\//,''),file=path.resolve(root,rel||'index.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 if(rel==='sw.js'){let text=fs.readFileSync(file,'utf8');if(upgraded)text=text.replace(/const CACHE=PREFIX\+'([^']+)';/,"const CACHE=PREFIX+'app-only-update-test';");res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-cache'});return res.end(text);}
 const gzip=/gzip/.test(req.headers['accept-encoding']||'')&&fs.existsSync(file+'.gz');res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache',...(gzip?{'Content-Encoding':'gzip'}:{})});fs.createReadStream(gzip?file+'.gz':file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(4183,'127.0.0.1',r));const b=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});try{
 const c=await b.newContext({viewport:{width:1526,height:866}});await c.addInitScript(()=>{localStorage.setItem('escape-atlas:v1:tutorial','1');localStorage.setItem('escape-atlas:v1:settings',JSON.stringify({reduce:true}));});const p=await c.newPage();await p.goto('http://127.0.0.1:4183/world/?test=1');await p.waitForFunction(()=>window.escapeTest?.atlas.ready);
 await p.click('#story-back');await p.click('[data-story="escape-11"]');await p.click('#launch-story');await p.waitForFunction(()=>window.escapeTest.getSession().game.scenarioId==='escape-11-op-1',null,{timeout:60000});await p.click('#clock-button');
 await p.waitForFunction(async()=>navigator.serviceWorker.controller&&await caches.match(new URL('data/osaka.geojson',location.href).href)&&await caches.match(new URL('data/tokyo.geojson',location.href).href),null,{timeout:60000});
 const before=await p.evaluate(()=>({game:window.escapeTest.getSession().game})),regionCache=await p.evaluate(async()=>(await caches.keys()).find(k=>k.includes(':regions-')));assert.ok(regionCache);
 const changed=p.waitForEvent('framenavigated',{timeout:60000});upgraded=true;await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await changed;
 await p.waitForFunction(async()=>(await caches.keys()).some(k=>k.endsWith(':app-only-update-test')),null,{timeout:60000});await p.waitForFunction(()=>window.escapeTest?.atlas.ready&&window.escapeTest.network.regions.size===2,null,{timeout:60000});
 assert.ok((await p.evaluate(()=>caches.keys())).includes(regionCache),'Dataset cache survives application-only activation');
 await c.setOffline(true);await p.reload();await p.waitForFunction(()=>window.escapeTest?.atlas.ready&&window.escapeTest.network.regions.size===2,null,{timeout:60000});const after=await p.evaluate(()=>window.escapeTest.getSession());assert.equal(after.game.cash,before.game.cash);assert.equal(after.game.elapsed,before.game.elapsed);assert.equal(after.clockRunning,false);assert.equal(after.game.scenarioId,before.game.scenarioId);
 console.log('PASS: application-only service-worker upgrade preserves both Japan map packs; offline reload retains resources and pause.');
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
