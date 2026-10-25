import {safePursuitLeg} from '../src/pursuit-validation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Network} from '../src/network.js';
import {LEGACY_CAMPAIGN as CAMPAIGN,ALL_SCENARIOS} from '../src/scenarios.js';
import {newGame,quoteJourney,depart,arrive,reviewArrival,completeDetour,advanceStage,advanceClock,readSave,makeSave} from '../src/engine.js';
const network=new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url))));
function travel(s,c,to,preferred='taxi'){s=reviewArrival(s);const mode=to===c.goal&&c.goalModes?c.goalModes[0]:preferred,safe=safePursuitLeg(s,c,network,to,mode);s=safe.state;const q=safe.quote;assert.ok(q.ok,`${c.id}: ${s.position} → ${to}: ${q.message}`);return arrive(depart(s,q).state,c);}
function tasks(c,first=0,last=0){return c.allDetours?c.detours:[c.detours[c.stage===0?first:c.stage===4?last:0]];}
test('eight sections carry one budget and clock through pickups, saves and checkpoints',()=>{
 let s=newGame(CAMPAIGN[0],'operation');
 for(const c of CAMPAIGN){
  const before=s.elapsed;
  for(const task of tasks(c)){
   assert.equal(completeDetour(s,c,task.id,{},network).ok,false,'Tasks require reaching their location');
   s=travel(s,c,task.place);const r=completeDetour(s,c,task.id,{},network);assert.ok(r.ok,r.message);s=r.state;
   assert.equal(completeDetour(s,c,task.id,{},network).ok,false,'No repeated rewards');
  }
  s=travel(s,c,c.goal);assert.ok(s.elapsed>before);
  const session={game:s,plan:[],custom:{},travelRemaining:0,clockRunning:false};const restored=readSave(makeSave(session),ALL_SCENARIOS);assert.ok(restored);assert.deepEqual(restored.game,s);
  if(c.stage<CAMPAIGN.length-1){assert.equal(s.phase,'checkpoint');const ticked=advanceClock(s,c,1);assert.equal(ticked.elapsed,s.elapsed+1);const next=advanceStage(ticked,c,CAMPAIGN[c.stage+1]);assert.equal(next.cash,s.cash);assert.equal(next.energy,s.energy);assert.equal(next.elapsed,s.elapsed+1);assert.equal(next.runId,s.runId);assert.deepEqual(next.stageVisited,[s.position]);s=next;}
 }
 assert.equal(s.phase,'won');assert.ok(s.cash>0);assert.ok(s.elapsed<CAMPAIGN[0].deadline);assert.ok(s.inventory.includes('passport'));assert.ok(s.inventory.includes('sealed package'));console.log(`Eight-stage Nightfall: £${s.cash} and ${Math.round(CAMPAIGN[0].deadline-s.elapsed)} minutes remain.`);
});
test('uncompleted detours block the checkpoint and invalid stage changes preserve state',()=>{
 const c=CAMPAIGN[0];const s=travel(newGame(c),c,'north');assert.equal(quoteJourney(reviewArrival(s),c,network,c.goal,'taxi').code,'detour');assert.equal(advanceStage(s,c,CAMPAIGN[1]),s);
});
for(const mode of ['taxi','bus'])for(const first of [0,1])for(const last of [0,1])test(`Nightfall alternative: ${mode}, detours ${first}/${last}`,()=>{
 let s=newGame(CAMPAIGN[0],'alternative');
 for(const c of CAMPAIGN){for(const task of tasks(c,first,last)){s=travel(s,c,task.place,mode);const r=completeDetour(s,c,task.id,{},network);assert.ok(r.ok,r.message);s=r.state;}s=travel(s,c,c.goal,mode);if(c.stage<CAMPAIGN.length-1)s=advanceStage(s,c,CAMPAIGN[c.stage+1]);}
 assert.equal(s.phase,'won');assert.ok(s.cash>=0);assert.ok(s.elapsed<CAMPAIGN[0].deadline);
});
test('passport is an actual required pickup, not a generic papers purchase',()=>{
 const c=CAMPAIGN[6],s=newGame(c);assert.equal(quoteJourney({...s,papers:true},c,network,'terespol','taxi').code,'inventory');
});
test('both final pickups are required and the last approach must be on foot',()=>{
 const c=CAMPAIGN[7];let s=travel(newGame(c),c,'kobylany');s=completeDetour(s,c,'sealed-package',{},network).state;
 assert.equal(quoteJourney(reviewArrival(s),c,network,c.goal,'walk').code,'detour');s=travel(s,c,'zalesie');s=completeDetour(s,c,'evac-supplies',{},network).state;
 assert.equal(quoteJourney(reviewArrival(s),c,network,c.goal,'taxi').code,'approach');const q=quoteJourney(reviewArrival(s),c,network,c.goal,'walk');assert.ok(q.ok,q.message);assert.ok(q.rests.length>0,'Final long walk must include recovery');
});
test('a completed older five-section save can continue without resetting resources',()=>{
 const c=CAMPAIGN[4],s={...newGame(c),phase:'won',position:c.goal,cash:97,elapsed:350,completedTasks:['relay']};const restored=readSave(makeSave({game:s,plan:[],custom:{},clockRunning:false}),ALL_SCENARIOS);assert.equal(restored.game.phase,'checkpoint');const next=advanceStage(restored.game,c,CAMPAIGN[5]);assert.equal(next.cash,97);assert.equal(next.elapsed,350);
});
