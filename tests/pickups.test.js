import test from 'node:test';
import assert from 'node:assert/strict';
import {pickupState,stopInfo,STOP_SYMBOLS,stopMarkerVisible} from '../src/pickups.js';
const places={a:{id:'a',kind:'station',coordinates:[0,0]},b:{id:'b',kind:'supply',coordinates:[.02,0]},cash:{id:'cash',kind:'supply'},goal:{id:'goal',kind:'shelter'}};
const task={id:'first',place:'a'},second={id:'second',place:'b',requires:['first']};
const scenario={goal:'goal',detours:[task,second],bonuses:[{id:'bonus',place:'cash',kind:'cash'}]};
test('pickup readiness follows location, completion and ordered prerequisites',()=>{
 const state={position:'a',completedTasks:[]},find=id=>places[id];
 assert.deepEqual(pickupState(state,task,find),{done:false,locked:false,at:true});
 assert.deepEqual(pickupState({...state,position:'b'},second,find),{done:false,locked:true,at:true});
 assert.deepEqual(pickupState({...state,position:'b',completedTasks:['first']},second,find),{done:false,locked:false,at:true});
 assert.equal(pickupState({...state,completedTasks:['first']},task,find).done,true);
 assert.equal(pickupState({...state,position:'missing'},task,find).at,false);
 assert.equal(pickupState({...state,position:'near'},task,id=>id==='near'?{coordinates:[.001,0]}:find(id)).at,true,'A chosen point within the engine pickup radius counts');
 assert.equal(pickupState({...state,position:'far'},task,id=>id==='far'?{coordinates:[.002,0]}:find(id)).at,false);
});
test('mission badges are distinct from place types, optional supplies and final destinations',()=>{
 const state={completedTasks:[]};
 assert.equal(stopInfo(places.a,state,scenario).badge,'1');
 assert.equal(stopInfo(places.a,state,scenario).symbol,STOP_SYMBOLS.station);
 assert.equal(stopInfo(places.b,state,scenario).badge,'2');
 assert.equal(stopInfo(places.cash,state,scenario).symbol,'£');
 assert.equal(stopInfo(places.goal,state,scenario).symbol,'◎');
 assert.equal(stopInfo(places.a,{completedTasks:['first']},scenario).badge,'✓');
 assert.equal(stopInfo(places.cash,{completedTasks:['bonus']},scenario).label,'COLLECTED');
});

test('mission markers survive zoom changes while respecting place layers and the active scenario',()=>{
 for(const zoom of [1,5,8,8.99,9,14])assert.equal(stopMarkerVisible({enabled:true,relevant:true,zoom,mission:true}),true);
 assert.equal(stopMarkerVisible({enabled:false,relevant:true,zoom:14,mission:true}),false);
 assert.equal(stopMarkerVisible({enabled:true,relevant:false,zoom:14,mission:true}),false);
 assert.equal(stopMarkerVisible({enabled:true,relevant:true,zoom:8}),false);
 assert.equal(stopMarkerVisible({enabled:true,relevant:true,zoom:9}),true);
 assert.equal(stopMarkerVisible({enabled:true,relevant:true,zoom:2,airport:true,global:true}),true);
});
