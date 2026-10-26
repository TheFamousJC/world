import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STORIES,THRILLER_STORY,ALL_SCENARIOS} from '../src/scenarios.js';
import {Network} from '../src/network.js';
import {WorldNetwork} from '../src/world-network.js';
import {newGame,completeDetour,cipherAction,quoteJourney,readSave,makeSave,advanceClock} from '../src/engine.js';
import {cipherCase,analyseEvidence,METHODS,missionRevealed,cipherEntry} from '../src/ciphers.js';
import {stopInfo} from '../src/pickups.js';
import {placeById} from '../src/places.js';
import {exportBackup,importBackup} from '../src/backups.js';
const n=new WorldNetwork(new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url))))),c=STORIES[0].operations[0];
const atFirst=()=>({...newGame(c,'cipher-test'),position:c.detours[0].place}),packet=()=>completeDetour(atFirst(),c,c.detours[0].id,{},n).state;
test('all 51 stories have five operations with three sequential, varied code missions',()=>{
 const ids=new Set(),seen=new Set();for(const story of [...STORIES,THRILLER_STORY]){assert.equal(story.operations.length,5);for(const op of story.operations){assert.equal(op.detours.length,3);assert.ok(op.codeMissions);for(const [i,t] of op.detours.entries()){assert.ok(!ids.has(t.id));ids.add(t.id);seen.add(t.cipher.method);assert.match(cipherCase(t).answer,/^\d{4}$/);if(i)assert.ok(t.requires.includes(op.detours[i-1].id));}if(op.global&&op.stage===2)assert.equal(placeById(op.detours[2].place).hub,placeById(op.detours[1].place).hub);}}assert.equal(ids.size,765);assert.equal(seen.size,6);
});
test('collection charges once and withholds completion, inventory and next mission until decoding',()=>{
 const start=atFirst(),s=packet(),t=c.detours[0];assert.equal(s.elapsed,start.elapsed+t.minutes);assert.deepEqual(s.completedTasks,[]);assert.deepEqual(s.inventory,[]);assert.equal(missionRevealed(s,c.detours[1]),false);assert.equal(stopInfo(placeById(c.detours[1].place),s,c).badge,'');assert.equal(completeDetour(s,c,t.id,{},n).ok,false);assert.equal(quoteJourney({...s,phase:'planning'},c,n,c.goal,'taxi').code,'detour');
 const r=cipherAction(s,c,t.id,'solve',cipherCase(t).answer);assert.ok(r.ok);assert.ok(r.state.completedTasks.includes(t.id));assert.ok(r.state.inventory.includes(t.items[0]));assert.equal(r.state.elapsed,s.elapsed);assert.ok(missionRevealed(r.state,c.detours[1]));assert.equal(missionRevealed(r.state,c.detours[2]),false);assert.equal(cipherAction(r.state,c,t.id,'solve',cipherCase(t).answer).ok,false);assert.deepEqual(s.completedTasks,[]);
});
test('wrong submissions spend two game minutes; malformed codes and uncollected cases reject atomically',()=>{
 const s=packet(),id=c.detours[0].id,wrong=cipherCase(c.detours[0]).answer==='0000'?'9999':'0000';assert.equal(cipherAction(atFirst(),c,id,'solve','1234').ok,false);assert.equal(cipherAction(s,c,id,'solve','bad').state,s);const r=cipherAction(s,c,id,'solve',wrong);assert.equal(r.ok,false);assert.equal(r.state.elapsed,s.elapsed+2);assert.equal(r.state.cash,s.cash);assert.equal(r.state.cipher.cases[id].attempts,1);assert.deepEqual(r.state.completedTasks,[]);assert.deepEqual(r.state.inventory,[]);
});
test('three paid clues charge exact prices once and cannot overdraw cash',()=>{
 let s=packet();const id=c.detours[0].id,cash=s.cash;for(const price of [4,8,12]){const r=cipherAction(s,c,id,'hint');assert.ok(r.ok);assert.equal(r.state.cash,s.cash-price);assert.equal(r.state.elapsed,s.elapsed);s=r.state;}assert.equal(s.cash,cash-24);assert.equal(cipherAction(s,c,id,'hint').state,s);const poor={...packet(),cash:3};assert.equal(cipherAction(poor,c,id,'hint').state,poor);
});
test('each analysis method extracts its code from supplied evidence and respects user inputs',()=>{
 for(const method of METHODS){const t={id:'lab',cipher:{method,seed:179532,number:1}},p=cipherCase(t);let output;if(method==='signals')output=analyseEvidence(p,method,{text:p.evidence});if(method==='metadata')output=analyseEvidence(p,method,{file:1});if(method==='registry')output=analyseEvidence(p,method,{query:p.rows[2].call});if(method==='timezone')output=analyseEvidence(p,method,{utc:String(Math.floor(p.utc/60)).padStart(2,'0')+':'+String(p.utc%60).padStart(2,'0'),offset:p.offset}).replace(':','');if(method==='coordinates')output=analyseEvidence(p,method,{lat:p.lat,lon:p.lon});if(method==='caesar')output=analyseEvidence(p,method,{text:p.ciphertext,shift:p.shift});assert.ok(output.includes(p.answer),method+' must produce the answer through its tool');}assert.match(analyseEvidence({},'signals',{text:'invalid'}),/Unknown/);assert.match(analyseEvidence({},'timezone',{utc:'29:70',offset:2}),/Enter/);
});
test('unsolved evidence, purchased clues and attempts survive reload and backups; corrupt saves reject',()=>{
 const id=c.detours[0].id;let s=cipherAction(packet(),c,id,'hint').state;const session={game:s,plan:[],custom:{},clockRunning:true,travelRemaining:0},raw=makeSave(session);assert.deepEqual(readSave(raw,ALL_SCENARIOS).game.cipher,s.cipher);assert.deepEqual(importBackup(exportBackup(session)).game.cipher,s.cipher);for(const patch of [{hints:4},{attempts:-1},{solvedAt:0},{at:s.elapsed+5}]){const bad=structuredClone(session);Object.assign(bad.game.cipher.cases[id],patch);assert.equal(readSave(makeSave(bad),ALL_SCENARIOS),null);}const missing=structuredClone(session);missing.game.completedTasks.push(id);assert.equal(readSave(makeSave(missing),ALL_SCENARIOS),null);
});
test('old saves retain completed work and resources, pause, and do not require repeating decoded missions',()=>{
 const id=c.detours[0].id,s=cipherAction(packet(),c,id,'solve',cipherCase(c.detours[0]).answer).state;delete s.cipher;const restored=readSave(makeSave({game:s,plan:[],custom:{},clockRunning:true,travelRemaining:0}),ALL_SCENARIOS);assert.ok(restored);assert.equal(restored.clockRunning,false);assert.equal(restored.game.cash,s.cash);assert.deepEqual(restored.game.inventory,s.inventory);assert.ok(cipherEntry(restored.game,id).solvedAt!==null);
});
test('future-operation cipher permissions cannot be injected into an earlier save',()=>{
 const s=packet(),future=STORIES[0].operations[1].detours[0];s.cipher.cases[future.id]={at:0,hints:0,attempts:0,solvedAt:0};s.completedTasks.push(future.id);
 assert.equal(readSave(makeSave({game:s,plan:[],custom:{},clockRunning:false}),ALL_SCENARIOS),null);
});
test('deadline and pursuit continue while a packet is unresolved',()=>{
 const s=packet(),id=c.detours[0].id;const expired=advanceClock({...s,elapsed:c.deadline-1},c,2);assert.equal(expired.phase,'lost');assert.equal(cipherAction(expired,c,id,'solve',cipherCase(c.detours[0]).answer).ok,false);const nearSearch=advanceClock(s,c,130);assert.equal(nearSearch.phase,'lost');assert.equal(nearSearch.pursuit.caught,true);
});
test('a collected timed packet does not count its handoff duration a second time',()=>{
 const s=packet(),t=c.detours[0],timed={...c,deliveryPilot:true,detours:[{...t,closesAt:s.elapsed+1}]};
 assert.notEqual(advanceClock(s,timed,.5).phase,'lost');
 assert.ok(cipherAction(s,timed,t.id,'solve',cipherCase(t).answer).ok);
 assert.equal(advanceClock(s,timed,2).phase,'lost');
});
