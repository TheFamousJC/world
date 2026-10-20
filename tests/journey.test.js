import test from 'node:test';
import assert from 'node:assert/strict';
import {walkingRestPlan,journeyFrame} from '../src/journey.js';
import {journeyCost,newGame,quoteJourney,depart,arrive,readSave,makeSave} from '../src/engine.js';
import {SCENARIOS} from '../src/scenarios.js';
import {Network} from '../src/network.js';
import fs from 'node:fs';
const network=new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url))));
test('a long walk automatically recovers at 20%, uses time, and never requires cash',()=>{
 const c={...SCENARIOS[0],deadline:2000},q=journeyCost({km:30,access:0,crossing:false},'walk',c,0,35);
 assert.ok(q.rests.length>=3);assert.equal(q.cash,0);assert.equal(q.minutes,400+q.rests.length*25);assert.ok(q.energyAfter>=20);assert.ok(q.rests.every(r=>r.energyBefore===20&&r.energyAfter===60));
});
test('mandatory recovery holds the traveller still while time passes and energy returns',()=>{
 const q=journeyCost({km:6,access:0,crossing:false},'walk',SCENARIOS[0],0,50),duringA=journeyFrame(q,72/q.minutes),duringB=journeyFrame(q,84/q.minutes);
 assert.match(duringA.stage,/MANDATORY REST/);assert.equal(duringA.progress,duringB.progress);assert.ok(duringB.energy>duringA.energy);assert.equal(journeyFrame(q,1).energy,q.energyAfter);assert.equal(journeyFrame(q,1).progress,1);
});
test('exhausted walking starts with recovery; an exhausted motor journey remains blocked',()=>{
 const c={...SCENARIOS[0],deadline:1000},s={...newGame(c),energy:0,cash:0},q=quoteJourney(s,c,network,'workshop','walk');assert.ok(q.ok,q.message);assert.equal(q.rests[0].at,0);assert.match(journeyFrame(q,.001).stage,/MANDATORY REST/);assert.equal(quoteJourney({...s,cash:60},c,network,'workshop','taxi').code,'energy');
});
test('mandatory rests survive reload and settle time, fare and energy exactly once',()=>{
 const c={...SCENARIOS[0],deadline:1000},s={...newGame(c),energy:22},q=quoteJourney(s,c,network,'workshop','walk');assert.ok(q.ok);assert.ok(q.rests.length);const game=depart(s,q).state,saved={game,plan:[{to:'workshop',mode:'walk'}],custom:{},clockRunning:true};
 const restored=readSave(makeSave(saved),[c]);assert.ok(restored);const done=arrive(restored.game,c);assert.equal(done.energy,q.energyAfter);assert.equal(done.elapsed,q.minutes);assert.equal(done.cash,s.cash);assert.deepEqual(arrive(done,c),done);
 const corrupt=structuredClone(saved);corrupt.game.pending.rests[0].minutes=0;assert.equal(readSave(makeSave(corrupt),[c]),null);
});
test('border control adds a visible stationary wait and no hidden fare',()=>{
 const route={km:10,access:0,crossing:true},c=SCENARIOS[0],base=journeyCost(route,'taxi',{...c,crossingDelay:0}),q={...journeyCost(route,'taxi',{...c,crossingDelay:60}),borderAt:.4};assert.equal(q.minutes-base.minutes,60);assert.equal(q.cash,base.cash);
 const stationary=Array.from({length:100},(_,i)=>journeyFrame(q,i/100)).filter(f=>f.stage.startsWith('BORDER CONTROL'));assert.ok(stationary.length>40);assert.ok(stationary.every(f=>f.progress===.4));
});
