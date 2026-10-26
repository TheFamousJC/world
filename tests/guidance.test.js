import test from 'node:test';
import assert from 'node:assert/strict';
import {nextStep} from '../src/guidance.js';
import {STORIES,PLACES,placeById} from '../src/scenarios.js';
import {newGame} from '../src/engine.js';
const c=STORIES[0].operations[0],s=newGame(c,'guidance');
test('guidance starts with a mission and becomes an explicit collection action on arrival',()=>{
 assert.equal(nextStep(s,c,placeById).target,c.detours[0].place);
 const arrived={...s,position:c.detours[0].place,phase:'arrived'};
 assert.equal(nextStep(arrived,c,placeById).kind,'collect');
 assert.equal(nextStep(arrived,c,placeById).task,c.detours[0].id);
 assert.equal(s.completedTasks.length,0,'Presentation does not collect an item');
});
test('planned contacts are reviewed, never silently removed or travelled',()=>{
 const plan=[{to:c.detours[0].place,mode:'taxi'},{to:c.detours[1].place,mode:'taxi'}],before=structuredClone(plan);
 assert.equal(nextStep(s,c,placeById,{plan}).kind,'review');assert.deepEqual(plan,before);
 assert.equal(nextStep(s,c,placeById,{blocked:true}).kind,'replace');
});
test('both missions lead to the destination and checkpoints lead to the next operation',()=>{
 const complete={...s,completedTasks:c.detours.map(t=>t.id)};
 assert.equal(nextStep(complete,c,placeById).target,c.goal);
 assert.match(nextStep(complete,c,placeById).detail,/All mission codes verified/);
 assert.equal(nextStep({...complete,phase:'checkpoint'},c,placeById).kind,'continue');
});
test('paused, travelling and finished states take precedence over route suggestions',()=>{
 assert.equal(nextStep(s,c,placeById,{running:false}).kind,'resume');
 assert.equal(nextStep({...s,phase:'travelling'},c,placeById).kind,'travel');
 assert.equal(nextStep({...s,phase:'won'},c,placeById).kind,'done');
});
test('the pilot points to document checks before its flight and after ground pickups',()=>{
 const pilot=STORIES[11].operations[2],state=newGame(pilot,'flight');state.completedTasks=[pilot.detours[0].id];
 assert.equal(nextStep(state,pilot,placeById).kind,'document');
 const ground=STORIES[11].operations[0],g=newGame(ground,'ground');g.completedTasks=ground.detours.map(t=>t.id);
 assert.equal(nextStep(g,ground,placeById).kind,'document');
});
test('world guidance uses the airport connection before an overseas contact',()=>{
 const world=STORIES[10].operations[2],state=newGame(world,'airports');state.completedTasks=[world.detours[0].id];
 const step=nextStep(state,world,placeById,{airports:PLACES.filter(p=>p.kind==='airport')});
 assert.equal(placeById(step.target).kind,'airport');assert.notEqual(placeById(step.target).hub,placeById(state.position).hub);assert.match(step.detail,/fly to/);
});
