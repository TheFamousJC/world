import test from 'node:test';import assert from 'node:assert/strict';import {newerRelease,workerRelease} from '../src/updates.js';
test('update prompts only describe genuinely newer known releases',()=>{
 for(const version of ['0.19.0','v0.19.0','0.18.1','0.9.9'])assert.equal(newerRelease(version,'v0.19.0'),false);
 for(const version of ['0.19.1','0.20.0','1.0.0'])assert.equal(newerRelease(version,'v0.19.0'),true);
 assert.equal(newerRelease(null,'v0.19.0'),true,'Legacy workers retain a recovery path');
});
test('worker release handshake reads version without activation or reload',async()=>{
 const worker={postMessage(message,ports){assert.equal(message.type,'GET_RELEASE');ports[0].postMessage({release:'0.19.0'});ports[0].close();}};
 assert.equal(await workerRelease(worker),'0.19.0');
});
