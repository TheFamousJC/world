import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MAP_PACKS} from '../src/map-packs.js';
import {Network} from '../src/network.js';
import {ARCHIVED_STORIES as STORIES,PLACES,placeById} from '../src/scenarios.js';
import {distance} from '../src/geo.js';

const legacyPacks=MAP_PACKS.filter(p=>p.hub.startsWith('world-'));
test('every worldwide operation declares a bounded OSM pack; flight handoffs never send players back downtown',()=>{
 assert.equal(legacyPacks.length,16);assert.equal(new Set(legacyPacks.map(p=>p.hub)).size,16);
 for(const story of STORIES.filter(s=>s.global)){
  assert.ok(story.detailed);
  for(const c of story.operations)for(const id of [c.start,c.goal,...c.detours.map(t=>t.place),...c.bonuses.map(t=>t.place)])assert.ok(MAP_PACKS.some(p=>p.hub===placeById(id).hub));
  const flight=story.operations[2],departure=placeById(flight.start),arrival=placeById(flight.goal);
  assert.equal(departure.kind,'airport');assert.equal(flight.detours[0].place,departure.id);
  assert.equal(placeById(flight.detours[1].place).hub,arrival.hub);
  assert.ok(flight.bonuses.every(b=>placeById(b.place).hub===arrival.hub),'No departure-city optional backtrack');
 }
});

for(const pack of legacyPacks)test(`${pack.name}: attributed offline geometry and connected real airport road routes`,()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../public/data/'+pack.file,import.meta.url)));
 assert.equal(data.metadata.licence,'ODbL 1.0');assert.ok(data.metadata.snapshot);assert.match(data.metadata.attribution,/OpenStreetMap/);
 assert.ok(data.features.filter(f=>f.properties.kind==='road').length>1000);
 assert.ok(data.features.some(f=>f.properties.kind==='building'));assert.ok(data.features.some(f=>f.properties.kind==='runway'));
 const n=new Network(data),points=PLACES.filter(p=>p.hub===pack.hub),reception=points.find(p=>p.id.endsWith('-0')),airport=points.find(p=>p.kind==='airport');
 assert.equal(points.length,9);assert.ok(distance(reception.coordinates,airport.coordinates)>2);
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)assert.ok(distance(points[i].coordinates,points[j].coordinates)>=.25,'Contacts are far enough apart for meaningful separate stops');
 const directed=new Set();for(const node of n.nodes.values())for(const e of node.edges)if(e.mask&4)directed.add(node.p.join(',')+'|'+n.nodes.get(e.to).p.join(','));
 for(const p of points){assert.equal(p.mapPack,pack.id);assert.ok(n.nodes.has(p.anchorNode));if(p===reception)continue;
  for(const mode of p.kind==='airport'?['taxi','bus']:['walk','taxi'])for(const [a,b] of [[reception,p],[p,reception]]){
   const r=n.route(a,b,mode);assert.ok(r,`${a.name} → ${b.name} (${mode})`);assert.equal(r.source,'OSM network');assert.equal(r.access,0);
   if(p===airport&&mode==='taxi')for(let i=2;i<r.coordinates.length-1;i++){
    const a=r.coordinates[i-1].join(','),b=r.coordinates[i].join(',');if(a!==b)assert.ok(directed.has(a+'|'+b),'Airport route follows permitted directed OSM edges');
   }
  }
 }
});
