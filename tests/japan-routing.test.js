import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Network} from '../src/network.js';
import {WorldNetwork} from '../src/world-network.js';
import {PLACES,STORIES,ALL_SCENARIOS,placeById} from '../src/scenarios.js';
import {journeyFrame} from '../src/journey.js';
import {distance,pointInArea} from '../src/geo.js';
import {newGame,quoteJourney,depart,arrive,makeSave,readSave} from '../src/engine.js';
import {loadCorridorPacks} from '../src/map-packs.js';
const local=new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url))));
const network=new WorldNetwork(local);
for(const [hub,city] of [['world-0-0','osaka'],['world-0-1','tokyo']])network.installRegion(hub,JSON.parse(fs.readFileSync(new URL('../public/data/'+city+'.geojson',import.meta.url))));

test('Japan packs have attributed real streets, buildings, railways, water and airport geometry',()=>{
 for(const n of network.regions.values()){const counts={};for(const f of n.data.features)counts[f.properties.kind]=(counts[f.properties.kind]||0)+1;
  assert.ok(counts.road>30000&&counts.building>20000&&counts.rail>1000&&counts['water-area']>100&&counts.runway>100);
  assert.equal(n.data.metadata.licence,'ODbL 1.0');assert.ok(n.data.metadata.snapshot);assert.equal(n.maxAccessKm,.08);
 }
});
test('real airport landside anchors are at Itami and Haneda rather than city-centre placeholders',()=>{
 const a=placeById('world-0-0-5'),b=placeById('world-0-1-5');assert.match(a.name,/Itami.*ITM/);assert.match(b.name,/Haneda.*HND/);
 assert.ok(distance(a.coordinates,[135.441,34.7896])<.5);assert.ok(distance(b.coordinates,[139.782,35.5495])<.5);
 assert.ok(distance(a.coordinates,placeById('world-0-0-0').coordinates)>10);assert.ok(distance(b.coordinates,placeById('world-0-1-0').coordinates)>8);
});
for(const [hub,city] of [['world-0-0','osaka'],['world-0-1','tokyo']])test(`${city}: every mission and optional contact has bidirectional real-road access`,()=>{
 const points=PLACES.filter(p=>p.hub===hub),n=network.regions.get(hub),reception=points.find(p=>p.id.endsWith('-0'));
 for(const p of points){assert.ok(n.nodes.has(p.anchorNode));if(p===reception)continue;for(const mode of ['walk','taxi','bus'])for(const [a,b] of [[reception,p],[p,reception]]){const r=network.route(a,b,mode);assert.ok(r,`${a.name} → ${b.name}, ${mode}`);assert.equal(r.source,'OSM network');assert.equal(r.access,0,'Named contacts use their exact public-road node');assert.ok(r.km>=distance(a.coordinates,b.coordinates));}}
});
test('airport taxi path consists entirely of permitted directed graph edges, without schematic segments',()=>{
 for(const hub of ['world-0-0','world-0-1']){
  const a=placeById(hub+'-0'),b=placeById(hub+'-5'),n=network.regions.get(hub),r=network.route(a,b,'taxi');assert.ok(r.coordinates.length>100);assert.ok(r.km>distance(a.coordinates,b.coordinates)*1.05);
  const edges=new Set();for(const node of n.nodes.values())for(const e of node.edges)if(e.mask&4)edges.add(node.p.join(',')+'|'+n.nodes.get(e.to).p.join(','));
  for(let i=2;i<r.coordinates.length-1;i++){const previous=r.coordinates[i-1],next=r.coordinates[i];if(previous[0]===next[0]&&previous[1]===next[1])continue;assert.ok(edges.has(previous.join(',')+'|'+next.join(',')),'Every driving segment must be a permitted OSM edge');}
 }
});
test('Japan never falls back to invented links when a pack or road connection is missing',()=>{
 const unloaded=new WorldNetwork(local),a=placeById('world-0-0-0'),b=placeById('world-0-0-1');assert.equal(unloaded.route(a,b,'taxi'),null);
 const remote={id:'waypoint-1',kind:'waypoint',hub:a.hub,corridor:a.corridor,coordinates:[135.416,34.804]};
 const n=network.regions.get(a.hub);const point=n.mapPoint(remote.coordinates,remote.id,'Outside mapped roads');if(point.unreachableReason)assert.equal(network.route(a,{...remote,...point},'walk'),null);
 const opposite=placeById('world-0-1-0');assert.equal(network.route(a,opposite,'taxi'),null);assert.equal(network.route(a,opposite,'walk'),null);
});
test('arbitrary Japan points use the regional graph and mapped water is rejected',()=>{
 const a=placeById('world-0-0-1'),p=network.mapPoint(a.coordinates,'waypoint-1','My street stop');assert.equal(p.hub,a.hub);assert.equal(p.mapPack,'osaka');assert.ok(network.route(placeById('world-0-0-0'),p,'walk'));
 const n=network.regions.get(a.hub);let water;
 for(const f of n.waterAreas){const ring=f.geometry.coordinates[0],c=ring.reduce((s,p)=>[s[0]+p[0]/ring.length,s[1]+p[1]/ring.length],[0,0]);if(pointInArea(c,f.geometry)){water=network.mapPoint(c,'waypoint-2','Water');if(water.hub&&water.unreachableReason?.includes('water'))break;}}
 assert.ok(water?.unreachableReason?.includes('water'));
});
test('old Japan pending journeys migrate without charging fares, resetting resources or losing items',()=>{
 const c=STORIES[10].operations[2],a=placeById(c.start),b=placeById('world-0-1-5');let s=newGame(c,'old-save');s.cash=171;s.elapsed=230;s.energy=70;s.inventory=['message transcript'];
 const q=quoteJourney(s,c,network,b.id,'flight');assert.ok(q.ok);s=depart(s,q).state;delete s.mapRevision;
 const restored=readSave(makeSave({game:s,plan:[{to:b.id,mode:'flight'}],custom:{},clockRunning:true,travelRemaining:1}),ALL_SCENARIOS);assert.ok(restored);
 assert.equal(restored.game.position,a.id);assert.equal(restored.game.cash,171);assert.equal(restored.game.elapsed,230);assert.equal(restored.game.energy,70);assert.deepEqual(restored.game.inventory,['message transcript']);assert.equal(restored.game.pending,null);assert.equal(restored.game.phase,'planning');assert.equal(restored.clockRunning,false);assert.deepEqual(restored.plan,[]);assert.equal(restored.mapUpgrade,true);assert.equal(restored.game.mapRevision,2);
 const current=newGame(c),flight=depart(current,quoteJourney(current,c,network,b.id,'flight')).state;assert.ok(readSave(makeSave({game:flight,plan:[],custom:{}}),ALL_SCENARIOS).game.pending,'New flights remain resumable');
});
test('mode rules reject private motor roads, foot corridors and reverse driving while allowing bicycle exceptions',()=>{
 const data={metadata:{bounds:[0,0,.02,.02],maxAccessKm:.08},features:[{type:'Feature',properties:{id:'a',kind:'road',class:'residential',nodes:[1,2],oneway:'yes','oneway:bicycle':'no'},geometry:{type:'LineString',coordinates:[[.001,.001],[.01,.001]]}},{type:'Feature',properties:{id:'b',kind:'road',class:'corridor',nodes:[2,3]},geometry:{type:'LineString',coordinates:[[.01,.001],[.01,.01]]}},{type:'Feature',properties:{id:'c',kind:'road',class:'service',nodes:[3,4],access:'private'},geometry:{type:'LineString',coordinates:[[.01,.01],[.001,.01]]}}]};
 const n=new Network(data),p=(id,coordinates)=>({id,coordinates}),a=p('a',[.001,.001]),b=p('b',[.01,.001]),c=p('c',[.01,.01]);
 assert.ok(n.route(a,b,'taxi'));assert.equal(n.route(b,a,'taxi'),null);assert.ok(n.route(b,a,'cycle'));assert.ok(n.route(b,c,'walk'));assert.equal(n.route(b,c,'taxi'),null);assert.equal(n.nodes.has('s:4'),false);
});

test('domestic airport checks happen before takeoff instead of freezing the flight in mid-air',()=>{
 const c=STORIES[10].operations[2],s=newGame(c),q=quoteJourney(s,c,network,'world-0-1-5','flight');assert.ok(q.ok);assert.equal(q.borderAt,0);
 const checking=journeyFrame(q,(q.waitMinutes+q.borderDelay/2)/q.minutes);assert.equal(checking.progress,0);assert.match(checking.stage,/AIRPORT CHECKS/);
 const flying=journeyFrame(q,(q.waitMinutes+q.borderDelay+(q.minutes-q.waitMinutes-q.borderDelay)/2)/q.minutes);assert.ok(flying.progress>.4&&flying.progress<.6);assert.equal(flying.stage,'EN ROUTE');
});
test('regional loader installs a complete corridor once, without contacting runtime map APIs',async t=>{
 const calls=[],regions=new Map(),stub={regions,installRegion:(hub,data)=>regions.set(hub,data)},data={type:'FeatureCollection',metadata:{bounds:[0,0,1,1]},features:[{type:'Feature'}]};
 t.mock.method(globalThis,'fetch',async url=>{calls.push(String(url));return new Response(JSON.stringify(data),{status:200});});
 await loadCorridorPacks('world-0',stub);assert.equal(regions.size,2);assert.equal(calls.length,2);assert.ok(calls.every(url=>url.endsWith('/data/osaka.geojson')||url.endsWith('/data/tokyo.geojson')));
 await loadCorridorPacks('world-0',stub);assert.equal(calls.length,2,'Already loaded regions are reused');
});
test('failed regional download does not install a half-loaded or schematic Japan corridor',async t=>{
 const regions=new Map(),stub={regions,installRegion:(hub,data)=>regions.set(hub,data)},data={type:'FeatureCollection',metadata:{bounds:[0,0,1,1]},features:[{type:'Feature'}]};
 t.mock.method(globalThis,'fetch',async url=>{if(String(url).endsWith('tokyo.geojson'))throw Error('Offline');return new Response(JSON.stringify(data),{status:200});});
 await assert.rejects(loadCorridorPacks('world-0',stub),/Connect once/);assert.equal(regions.size,0);
});
