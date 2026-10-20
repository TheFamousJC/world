import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Network} from '../src/network.js';
import {CAMPAIGN,ALL_SCENARIOS} from '../src/scenarios.js';
import {newGame,quoteJourney,depart,arrive,reviewArrival,completeDetour,advanceStage,advanceClock,readSave,makeSave} from '../src/engine.js';
const network=new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url))));
function travel(s,c,to){s=reviewArrival(s);const q=quoteJourney(s,c,network,to,'taxi');assert.ok(q.ok,`${c.id}: ${s.position} → ${to}: ${q.message}`);return arrive(depart(s,q).state,c);}
test('five sections carry one budget and clock through detours, saves and checkpoints',()=>{
 let s=newGame(CAMPAIGN[0],'operation');
 for(const c of CAMPAIGN){
  const before=s.elapsed,task=c.detours[0];
  assert.equal(completeDetour(s,c,task.id).ok,false,'Tasks require reaching their location');
  s=travel(s,c,task.place);const r=completeDetour(s,c,task.id);assert.ok(r.ok,r.message);s=r.state;
  assert.equal(completeDetour(s,c,task.id).ok,false,'No repeated rewards');
  s=travel(s,c,c.goal);assert.ok(s.elapsed>before);
  const session={game:s,plan:[],custom:{},travelRemaining:0,clockRunning:false};const restored=readSave(makeSave(session),ALL_SCENARIOS);assert.ok(restored);assert.deepEqual(restored.game,s);
  if(c.stage<4){assert.equal(s.phase,'checkpoint');const ticked=advanceClock(s,c,1);assert.equal(ticked.elapsed,s.elapsed+1,'Checkpoint clock continues');const next=advanceStage(ticked,c,CAMPAIGN[c.stage+1]);assert.equal(next.cash,s.cash);assert.equal(next.energy,s.energy);assert.equal(next.elapsed,s.elapsed+1);assert.equal(next.runId,s.runId);assert.deepEqual(next.stageVisited,[s.position]);s=next;}
 }
 assert.equal(s.phase,'won');assert.ok(s.cash>0);assert.ok(s.elapsed<720);console.log(`Nightfall: £${s.cash} and ${Math.round(720-s.elapsed)} minutes remain.`);
});
test('uncompleted detours block the checkpoint and invalid stage changes preserve state',()=>{
 const c=CAMPAIGN[0];let s=travel(newGame(c),c,'north');assert.equal(quoteJourney(reviewArrival(s),c,network,c.goal,'taxi').code,'detour');assert.equal(advanceStage(s,c,CAMPAIGN[1]),s);
});

for(const mode of ['taxi','bus'])for(const first of [0,1])for(const last of [0,1])test(`Nightfall alternative: ${mode}, detours ${first}/${last}`,()=>{
 let s=newGame(CAMPAIGN[0],'alternative');
 for(const c of CAMPAIGN){const task=c.detours[c.stage===0?first:c.stage===4?last:0];for(const to of [task.place,c.goal]){s=reviewArrival(s);const q=quoteJourney(s,c,network,to,mode);assert.ok(q.ok,q.message);s=arrive(depart(s,q).state,c);if(to===task.place){const r=completeDetour(s,c,task.id);assert.ok(r.ok,r.message);s=r.state;}}if(c.stage<4)s=advanceStage(s,c,CAMPAIGN[c.stage+1]);}
 assert.equal(s.phase,'won');assert.ok(s.cash>=0);assert.ok(s.elapsed<720);
});
