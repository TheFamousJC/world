import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STORIES,ALL_SCENARIOS,PLACES,placeById} from '../src/scenarios.js';
import {Network} from '../src/network.js';
import {WorldNetwork} from '../src/world-network.js';
import {simulateStory} from '../src/story-validation.js';
import {newGame,quoteJourney,completeDetour,collectBonus,depart,arrive,reviewArrival,advanceClock,makeSave,readSave} from '../src/engine.js';
const n=new WorldNetwork(new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url)))));
test('catalogue has exactly 50 coherent stories, 250 operations and 500 ordered missions',()=>{
 assert.equal(STORIES.length,50);const ids=[];
 for(const s of STORIES){assert.equal(s.operations.length,5);assert.equal(s.chapters.length,5);assert.equal(s.items.length,10);assert.ok(s.intro.length>100&&s.ending.length>40);
  for(const [i,c] of s.operations.entries()){ids.push(c.id);assert.equal(c.stage,i);assert.equal(c.stageCount,5);assert.equal(c.deadline,1440);assert.equal(c.detours.length,2);assert.equal(c.bonuses.length,2);assert.deepEqual(c.bonuses.map(b=>b.kind),['cash','energy']);assert.equal(new Set([c.start,c.goal,...c.detours.map(t=>t.place),...c.bonuses.map(t=>t.place)]).size,6);assert.equal(c.detours[1].requires[0],c.detours[0].id);if(i){assert.equal(c.start,s.operations[i-1].goal);assert.ok(c.travelFactor>s.operations[i-1].travelFactor);assert.ok(c.effortFactor>s.operations[i-1].effortFactor);assert.ok(c.detours[0].minutes>s.operations[i-1].detours[0].minutes);}for(const t of [...c.detours,...c.bonuses]){assert.ok(placeById(t.place));ids.push(t.id);}}
 }
 assert.equal(new Set(ids).size,1250);assert.equal(new Set(STORIES.flatMap(s=>s.operations).map(c=>[c.start,c.goal,...c.detours.map(t=>t.place)].join('|'))).size,250,'Every operation has a distinct ordered pickup route');
});
for(const story of STORIES)test(`${story.id}: two complete 24-hour strategies with saves and resource carry-over`,()=>{
 const a=simulateStory(story,n,'bus'),b=simulateStory(story,n,'taxi',true);
 for(const run of [a,b]){assert.equal(run.state.phase,'won');assert.ok(run.state.elapsed<1440);assert.ok(run.state.cash>=0);assert.ok(run.state.energy>=0&&run.state.energy<=100);assert.equal(run.state.inventory.length,10);assert.equal(run.state.runId.startsWith(story.id),true);}
 assert.notDeepEqual(a.legs,b.legs);assert.ok(b.state.completedTasks.filter(id=>id.endsWith('-cash')).length===5);
 if(story.global)assert.equal(a.legs.filter(l=>l.mode==='flight').length,1);
});
for(const story of STORIES)for(const c of story.operations)test(`${c.id}: mission, resource, deadline, location and replay failure guards`,()=>{
 let s=newGame(c);const [a,b]=c.detours;
 assert.equal(completeDetour(s,c,a.id).ok,false);
 assert.equal(completeDetour({...s,position:b.place},c,b.id).ok,false,'Cannot collect mission 2 first');
 assert.equal(quoteJourney({...s,position:b.place,stageVisited:[c.start,b.place]},c,n,c.goal,'taxi').code,'detour');
 s={...s,position:a.place};s=completeDetour(s,c,a.id).state;const replay=completeDetour(s,c,a.id);assert.equal(replay.ok,false);assert.equal(replay.state,s);
 assert.equal(quoteJourney({...s,position:b.place,phase:'planning'},c,n,c.goal,'taxi').code,'detour','Both tasks required');
 s=completeDetour({...s,position:b.place},c,b.id).state;s={...s,phase:'planning',stageVisited:[c.start,a.place,b.place],energy:100};
 const q=quoteJourney(s,c,n,c.goal,'taxi');assert.ok(q.ok,q.message);
 assert.equal(quoteJourney({...s,cash:0},c,n,c.goal,'taxi').code,'money');assert.equal(quoteJourney({...s,elapsed:1439},c,n,c.goal,'taxi').code,'deadline');
 assert.equal(advanceClock({...s,elapsed:1439},c,1).phase,'lost');
 for(const bonus of c.bonuses){assert.equal(collectBonus(s,c,bonus.id).ok,false);const ready={...s,position:bonus.place,energy:50};const r=collectBonus(ready,c,bonus.id);assert.ok(r.ok,r.message);assert.equal(r.state.cash,ready.cash+bonus.reward);assert.equal(r.state.energy,Math.min(100,ready.energy+bonus.energy));assert.equal(r.state.elapsed,ready.elapsed+bonus.minutes);assert.equal(collectBonus(r.state,c,bonus.id).state,r.state);assert.ok(readSave(makeSave({game:r.state,custom:{},plan:[]}),ALL_SCENARIOS));}
});
test('flight requires designated connected terminals; no ocean walking or arbitrary airports',()=>{
 const c=STORIES[10].operations[2],s={...newGame(c),phase:'planning'},a=placeById(c.start),b=PLACES.find(p=>p.corridor===c.corridor&&p.hub!==a.hub&&p.kind==='airport');
 assert.equal(n.route(a,b,'walk'),null);assert.equal(n.route(a,b,'taxi'),null);assert.ok(n.route(a,b,'flight'));assert.equal(n.route({...a,kind:'waypoint'},b,'flight'),null);
 const q=quoteJourney(s,c,n,b.id,'flight');assert.ok(q.ok);assert.equal(q.waitMinutes,45);assert.ok(q.borderDelay>=45);
 const pending=depart(s,q).state,loaded=readSave(makeSave({game:pending,custom:{},plan:[]}),ALL_SCENARIOS);assert.ok(loaded);const end=arrive(loaded.game,c);assert.equal(end.cash,s.cash-q.cash);assert.equal(arrive(end,c),end);
});
