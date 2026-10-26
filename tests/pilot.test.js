import test from 'node:test';
import assert from 'node:assert/strict';
import {STORIES,ALL_SCENARIOS,placeById} from '../src/scenarios.js';
import {newGame,quoteJourney,journeyCost,depart,arrive,advanceClock,advanceStage,makeSave,readSave} from '../src/engine.js';
import {pilotAction,reportView,documentCleared,timetable,pilotCost,observeReport} from '../src/pilot.js';
import {journeyFrame} from '../src/journey.js';
const story=STORIES.find(s=>s.id==='escape-12'),answers=c=>Object.fromEntries(c.pilot.document.fields.map(f=>[f.id,f.answer]));
const network={route:(a,b)=>({coordinates:[a.coordinates,b.coordinates],km:2,access:0,crossing:a.hub!==b.hub}),borders:[]};
const ready=c=>({...newGame(c),position:c.detours[1].place,completedTasks:c.detours.map(t=>t.id),cipher:{version:1,cases:Object.fromEntries(c.detours.map(t=>[t.id,{at:0,hints:0,attempts:0,solvedAt:0}]))},stageVisited:[c.start,...c.detours.map(t=>t.place)]});

test('only one complete five-operation story opts into the pilot',()=>{
 assert.equal(STORIES.filter(s=>s.operations.some(c=>c.pilot)).length,1);assert.equal(story.operations.length,5);
 assert.ok(story.operations.every(c=>c.pilot.document.fields.length===2));
});
for(const c of story.operations){
 test(`${c.id}: evidence, wrong answers, clearance, replay and independent stage gate`,()=>{
  let s=newGame(c);assert.equal(pilotAction(s,c,'document',answers(c)).state,s);
  s=ready(c);const bad=pilotAction(s,c,'document',{field0:'wrong',field1:'wrong'});assert.equal(bad.ok,false);assert.equal(bad.state.elapsed,s.elapsed+4);assert.equal(bad.state.cash,s.cash);assert.equal(documentCleared(bad.state,c),false);
  assert.equal(quoteJourney(s,c,network,c.goal,'taxi').code,'document');
  const r=pilotAction(bad.state,c,'document',answers(c));assert.ok(r.ok);assert.equal(r.state.elapsed,s.elapsed+7);assert.ok(documentCleared(r.state,c));assert.equal(pilotAction(r.state,c,'document',answers(c)).state,r.state);
  const q=quoteJourney(r.state,c,network,c.goal,'taxi');assert.ok(q.ok,q.message);const end=arrive(depart(r.state,q).state,c);assert.equal(end.cash,r.state.cash-q.cash);assert.equal(end.elapsed,r.state.elapsed+q.minutes);assert.equal(arrive(end,c),end);
  const loaded=readSave(makeSave({game:end,custom:{},plan:[]}),ALL_SCENARIOS);assert.ok(loaded);assert.ok(documentCleared(loaded.game,c));
  if(c.stage<4){const next=story.operations[c.stage+1],carried=advanceStage(end,c,next);assert.equal(carried.cash,end.cash);assert.equal(carried.elapsed,end.elapsed);assert.equal(carried.pilot.starts[next.id],end.elapsed);assert.equal(documentCleared(carried,next),false);assert.ok(readSave(makeSave({game:carried,custom:{},plan:[]}),ALL_SCENARIOS));}
 });
 test(`${c.id}: report provenance, enquiry cost, aging and duplicate protection`,()=>{
  const s=newGame(c),rumour=reportView(s,c);assert.match(rumour.confidence,/Unverified/);assert.equal(rumour.age,20);
  const r=pilotAction(s,c,'verify');assert.ok(r.ok);assert.equal(r.state.cash,s.cash-2);assert.equal(r.state.elapsed,5);assert.equal(reportView(r.state,c).source,'Dispatch confirmation');assert.equal(reportView(r.state,c).age,0);
  assert.equal(pilotAction(r.state,c,'verify').state,r.state);assert.match(reportView(advanceClock(r.state,c,46),c).confidence,/Aging/);
  assert.equal(pilotAction({...s,cash:1},c,'verify').state.cash,1);assert.equal(pilotAction({...s,elapsed:1438},c,'verify').state.elapsed,1438);
 });
}
test('unknown motor estimates omit a deterministic reported delay; verification matches departure accounting',()=>{
 const c=story.operations[0],s=newGame(c),route=network.route(placeById(c.start),placeById(c.detours[0].place));
 const estimate=journeyCost(route,'taxi',c,0,100,{state:s,to:c.detours[0].place}),actual=journeyCost(route,'taxi',c,0,100,{state:s,to:c.detours[0].place,actual:true});assert.equal(actual.minutes-estimate.minutes,18);
 const checked=pilotAction(s,c,'verify').state;assert.equal(journeyCost(route,'taxi',c,5,100,{state:checked}).minutes,actual.minutes);
 assert.equal(pilotCost(s,c,'walk',c.goal,true).extra,0);
});
test('airport shuttle suspension rejects before charging; waiting for reopening or switching to taxi works',()=>{
 const c=story.operations[1],s=pilotAction(ready(c),c,'document',answers(c)).state;
 const q=quoteJourney(s,c,network,c.goal,'bus');assert.equal(q.code,'timetable');assert.equal(depart(s,q).state,s);assert.ok(quoteJourney(s,c,network,c.goal,'taxi').ok);
 assert.ok(quoteJourney({...s,elapsed:121},c,network,c.goal,'bus').ok);
});
test('flight check-in cutoff, waiting, next departure and final flight are exact and deterministic',()=>{
 const c=story.operations[2],cutoff=180-45-c.crossingDelay,lastCutoff=540-45-c.crossingDelay;assert.equal(timetable(c,'flight',0,0).departure,180);assert.equal(timetable(c,'flight',cutoff,0).departure,180);assert.equal(timetable(c,'flight',cutoff+.01,0).departure,300);
 assert.equal(timetable(c,'flight',lastCutoff,0).available,true);assert.equal(timetable(c,'flight',lastCutoff+.01,0).available,false);
 let s={...ready(c),position:c.start};s=pilotAction(s,c,'document',answers(c)).state;const q=quoteJourney(s,c,network,'world-0-1-5','flight');assert.ok(q.ok);assert.equal(q.schedule.departure,180);assert.ok(q.waitMinutes>45);assert.equal(journeyFrame(q,.01).progress,0);
 assert.equal(depart({...s,elapsed:s.elapsed+1},q).ok,false,'A quote cannot survive a changed clock');
 const miss=quoteJourney({...s,elapsed:lastCutoff+1},c,network,'world-0-1-5','flight');assert.equal(miss.code,'timetable');assert.equal(depart({...s,elapsed:441},miss).ok,false);
});
test('saved reports and clearances reject tampering; pre-pilot saves migrate without spending resources',()=>{
 const c=story.operations[0],s=pilotAction(ready(c),c,'document',answers(c)).state;
 const session={game:s,custom:{},plan:[],clockRunning:true};assert.ok(readSave(makeSave(session),ALL_SCENARIOS));
 const bad=structuredClone(session);bad.game.pilot.documents[c.id].field0='wrong';assert.equal(readSave(makeSave(bad),ALL_SCENARIOS),null);
 const future=structuredClone(session);future.game.pilot.reports[c.id]={at:100};assert.equal(readSave(makeSave(future),ALL_SCENARIOS),null);
 const old=structuredClone(session);delete old.game.pilot;old.plan=[{to:c.goal,mode:'taxi'}];const migrated=readSave(makeSave(old),ALL_SCENARIOS);assert.ok(migrated);assert.equal(migrated.clockRunning,false);assert.equal(migrated.game.cash,s.cash);assert.equal(migrated.game.elapsed,s.elapsed);assert.deepEqual(migrated.plan,[]);
});
test('waiting advances timetable and report age without spending cash or energy; old quotes expire',()=>{
 const c=story.operations[0],s=newGame(c),q=quoteJourney(s,c,network,c.detours[0].place,'taxi'),r=pilotAction(s,c,'wait');assert.ok(r.ok);assert.equal(r.state.elapsed,15);assert.equal(r.state.cash,s.cash);assert.equal(r.state.energy,s.energy);assert.equal(reportView(r.state,c).age,35);assert.equal(depart(r.state,q).ok,false);
 assert.equal(pilotAction({...s,elapsed:1430},c,'wait').state.elapsed,1430);
});
test('departure reveals an outdated report and records the actual delay without changing the fare',()=>{
 const c=story.operations[0],s=newGame(c),q=quoteJourney(s,c,network,c.detours[0].place,'taxi');assert.match(q.notice,/18 minutes/);const d=depart(s,q).state;assert.equal(d.cash,s.cash);assert.equal(reportView(d,c).source,'Departure check');assert.ok(d.history.some(h=>h.type==='conditions'));const end=arrive(d,c);assert.equal(end.cash,s.cash-q.cash);assert.equal(end.elapsed,q.minutes);
 const learned=observeReport(s,c);assert.equal(learned.cash,s.cash);assert.equal(learned.elapsed,s.elapsed);assert.equal(reportView(learned,c).source,'Departure check');
});
test('airport evidence alone permits flight clearance, while generic papers cannot bypass it',()=>{
 const c=story.operations[2],s={...newGame(c),papers:true,completedTasks:[c.detours[0].id]};assert.equal(quoteJourney(s,c,network,'world-0-1-5','flight').code,'document');const checked=pilotAction(s,c,'document',answers(c));assert.ok(checked.ok);assert.ok(quoteJourney(checked.state,c,network,'world-0-1-5','flight').ok);
});
test('confirmed reports can be refreshed once stale, with the advertised charge',()=>{
 const c=story.operations[0],s=pilotAction(newGame(c),c,'verify').state,aged=advanceClock(s,c,45),r=pilotAction(aged,c,'verify');assert.ok(r.ok);assert.equal(r.state.cash,aged.cash-2);assert.equal(r.state.elapsed,aged.elapsed+5);assert.equal(reportView(r.state,c).age,0);
});
test('in-flight saves resume once; pre-pilot pending journeys migrate without a fare',()=>{
 const c=story.operations[2],s=pilotAction({...newGame(c),completedTasks:[c.detours[0].id],cipher:{version:1,cases:{[c.detours[0].id]:{at:0,hints:0,attempts:0,solvedAt:0}}}},c,'document',answers(c)).state,q=quoteJourney(s,c,network,'world-0-1-5','flight'),pending=depart(s,q).state;
 const session={game:pending,custom:{},plan:[{to:q.to,mode:'flight'}],clockRunning:true,travelRemaining:1},loaded=readSave(makeSave(session),ALL_SCENARIOS);assert.ok(loaded);assert.deepEqual(loaded.game.pending,pending.pending);const end=arrive(loaded.game,c);assert.equal(end.cash,s.cash-q.cash);assert.equal(arrive(end,c),end);
 delete session.game.pilot;const migrated=readSave(makeSave(session),ALL_SCENARIOS);assert.ok(migrated);assert.equal(migrated.game.phase,'planning');assert.equal(migrated.game.pending,null);assert.equal(migrated.game.cash,s.cash);assert.equal(migrated.game.elapsed,s.elapsed);assert.equal(migrated.travelRemaining,0);
});
test('future-operation permissions and start times cannot be smuggled into an earlier save',()=>{
 const c=story.operations[0],future=story.operations[4],s=newGame(c);s.pilot.documents[future.id]=answers(future);assert.equal(readSave(makeSave({game:s,custom:{},plan:[]}),ALL_SCENARIOS),null);s.pilot.documents={};s.pilot.starts[future.id]=0;assert.equal(readSave(makeSave({game:s,custom:{},plan:[]}),ALL_SCENARIOS),null);
});
