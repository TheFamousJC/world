// Final, deterministic preparation gate. No runtime downloads or straight-road fallbacks.
import fs from 'node:fs';
import path from 'node:path';
import {ExpeditionNetwork} from '../src/expedition-network.js';
import {MODES} from '../src/network.js';
import {distance,lineLength,pointInArea} from '../src/geo.js';
const folder='assets/prepared-worlds',routes=JSON.parse(fs.readFileSync(folder+'/catalogue.json','utf8')),problems=[];
if(routes.length!==49)throw Error('Compile all 49 remaining maps first; got '+routes.length);
function nearestPort(n,r,i,reference){const core=r.places.find(p=>p.id===r.id+'-c'+i+'-p0');const nodes=[...n.nodes].filter(([id,v])=>id.startsWith('s:')&&(v.mask&1)&&distance(reference,v.p)<1).sort((a,b)=>distance(a[1].p,reference)-distance(b[1].p,reference));for(const [anchor,v] of nodes){const p={...core,id:r.id+'-c'+i+'-port',name:r.cities[i].name+' · ferry terminal approach',coordinates:v.p,anchorNode:anchor,kind:'port',serviceType:'port',note:'Fictional boarding at an approximate landside port approach. Crossing geometry is a geographic game corridor.'};if(n.ground(core,p,'walk')&&n.ground(p,core,'walk'))return p;}return null;}
for(const r of routes){const file=folder+'/'+r.id+'.geojson',data=JSON.parse(fs.readFileSync(file,'utf8'));let n=new ExpeditionNetwork(data);
 // An OSRM snap can land on the opposite bank of a small island. Keep every
 // fictional city interchange on its contacts' physically connected shore.
 for(let i=0;i<5;i++){
  const core=r.places.find(p=>p.id===r.id+'-c'+i+'-p2');
  for(const number of [0,1]){const terminal=r.places.find(p=>p.id===r.id+'-c'+i+'-p'+number);if(n.ground(core,terminal,'walk')&&n.ground(terminal,core,'walk'))continue;
   const occupied=r.places.filter(p=>p.cityIndex===i&&p.id!==terminal.id&&/[-]p[0-7]$/.test(p.id));
   const options=[...n.nodes].filter(([id,v])=>id.startsWith('s:')&&(v.mask&1)&&distance(v.p,r.cities[i].coordinates)<1.8&&occupied.every(p=>distance(p.coordinates,v.p)>=.035)).sort((a,b)=>distance(a[1].p,r.cities[i].coordinates)-distance(b[1].p,r.cities[i].coordinates));
   for(const [anchor,v] of options){const candidate={...terminal,coordinates:v.p,anchorNode:anchor};if(n.ground(core,candidate,'walk')&&n.ground(candidate,core,'walk')){Object.assign(terminal,candidate);terminal.note='Fictional interchange on the same connected street district as its contacts.';break;}}
  }
 }
 if(r.id==='atlas-36'){
  const aliases=new Map();for(const port of r.places.filter(p=>p.kind==='port'&&/^atlas-36-c[0-4]-port$/.test(p.id))){const core=r.places.find(p=>p.id===r.id+'-c'+port.cityIndex+'-p0');aliases.set(port.id,core.id);core.kind='port';core.serviceType='port';core.name=r.cities[core.cityIndex].name+' · river landing';core.note='Fictional shore transfer on the connected street district; river geography is generalized.';}
  for(const service of data.metadata.expedition.services.filter(s=>s.mode==='boat')){service.from=aliases.get(service.from)||service.from;service.to=aliases.get(service.to)||service.to;const a=r.places.find(p=>p.id===service.from),b=r.places.find(p=>p.id===service.to);service.coordinates=[a.coordinates,...service.coordinates.slice(1,-1),b.coordinates];service.km=lineLength(service.coordinates);service.minutes=Math.ceil(service.km/28*60);}
  r.places=r.places.filter(p=>!aliases.has(p.id));
 }
 // Only short, dry, approximate access between two sourced road representations.
 const joinAccess=(cityIndex,origin,key)=>{
  const core=r.places.find(p=>p.id===r.id+'-c'+cityIndex+'-p2');let start=null;
  for(const f of data.features){if(!f.properties.id?.startsWith('osrm:')||f.properties.kind!=='road')continue;const index=f.geometry.coordinates.findIndex(p=>distance(p,origin)<.0001);if(index>=0){const id='s:'+f.properties.nodes[index];start=[id,n.nodes.get(id)];break;}}
  if(!start?.[1])return;const reference={id:'reference-'+key,coordinates:start[1].p,anchorNode:start[0]};if(n.ground(core,reference,'taxi')&&n.ground(reference,core,'taxi'))return;
  const near=[...n.nodes].filter(([id,v])=>id.startsWith('s:')&&(v.mask&5)===5&&distance(v.p,origin)<.08).sort((a,b)=>distance(a[1].p,origin)-distance(b[1].p,origin));
  for(const [id,v] of near){const point={id:'public-access-'+id,coordinates:v.p,anchorNode:id};if(!n.ground(core,point,'taxi')||!n.ground(point,core,'taxi'))continue;
   const wet=[.2,.4,.6,.8].some(t=>n.waterAreas.some(f=>pointInArea([origin[0]+(v.p[0]-origin[0])*t,origin[1]+(v.p[1]-origin[1])*t],f.geometry)));if(wet)continue;
   data.features.push({type:'Feature',properties:{id:r.id+'-access-'+key,kind:'road',class:'service',foot:'no',bicycle:'no',nodes:[Number(start[0].slice(2)),Number(id.slice(2))],source:'Approximate dry landside access within 80 m'},geometry:{type:'LineString',coordinates:[start[1].p,v.p]}});n=new ExpeditionNetwork(data);break;
  }
 };
 for(let i=0;i<4;i++){const line=data.metadata.expedition.roadLegs[i]?.coordinates;if(line){joinAccess(i,line[0],'departure-'+i);joinAccess(i+1,line.at(-1),'arrival-'+i);}}
 for(const airport of r.places.filter(p=>p.kind==='airport')){const raw='assets/route-source/'+r.cities[airport.cityIndex].key+'-airroad.json';if(fs.existsSync(raw)){const line=JSON.parse(fs.readFileSync(raw,'utf8')).routes?.[0]?.geometry.coordinates;if(line)joinAccess(airport.cityIndex,line[0],'airport-'+airport.cityIndex);}}
 if(r.id==='atlas-50'){
  const a=nearestPort(n,r,1,[-5.318,35.894]),b=nearestPort(n,r,2,[-5.44,36.129]);
  if(a&&b){r.places.push(a,b);const coordinates=[a.coordinates,[-5.318,35.894],[-5.33,35.94],[-5.36,36.02],[-5.4,36.095],[-5.44,36.129],b.coordinates],access=distance(a.coordinates,coordinates[1])+distance(b.coordinates,coordinates.at(-2)),km=lineLength(coordinates),s={from:a.id,to:b.id,mode:'ferry',coordinates,km,access,minutes:Math.ceil((km-access)/32*60),source:'Authored Strait of Gibraltar game corridor; approximate port approaches'};data.metadata.expedition.services=data.metadata.expedition.services.filter(v=>v.from!==a.id||v.to!==b.id);data.metadata.expedition.services.push(s);r.services.push({from:s.from,to:s.to,mode:s.mode,km,minutes:s.minutes});data.features=data.features.filter(f=>f.properties.id!=='game-strait-ferry');data.features.push({type:'Feature',properties:{id:'game-strait-ferry',kind:'water-route',name:'Strait ferry game corridor'},geometry:{type:'LineString',coordinates}});}
  else problems.push(r.id+' no connected shore terminal');
 }
 // Add source resolution and local availability to the runtime map.
 data.metadata.expedition.cities.forEach((c,i)=>c.localModes=r.cities[i].localModes);
 n=new ExpeditionNetwork(data);const ground=(a,b)=>{if(a.id===b.id)return {km:0,minutes:0};for(const mode of ['bus','taxi','walk']){const q=n.route(a,b,mode);if(!q)continue;const energy=MODES[mode].energy*q.km;if(mode!=='walk'&&energy>70)continue;return {km:q.km,minutes:q.km/MODES[mode].speed*60,cash:MODES[mode].base+MODES[mode].perKm*q.km};}return null;};
 r.connections=[];
 for(let i=0;i<4;i++){
  const start=r.places.find(p=>p.id===r.id+'-c'+i+'-p1'),end=r.places.find(p=>p.id===r.id+'-c'+(i+1)+'-p0'),from=r.places.filter(p=>p.cityIndex===i&&p.serviceType),to=r.places.filter(p=>p.cityIndex===i+1&&p.serviceType),candidates=[];
  for(const a of from)for(const b of to)for(const mode of ['coach','train','boat','ferry','flight']){if(i<3&&b.id===r.id+'-c'+(i+1)+'-p1')continue;const q=n.route(a,b,mode);if(!q)continue;const first=ground(start,a),last=ground(b,end);if(!first||!last)continue;
   const priority=r.id==='atlas-36'&&i>0&&mode==='boat'?0:mode==='coach'?1:mode==='train'?2:mode==='boat'||mode==='ferry'?3:4;
   candidates.push({mode,from:a.id,to:b.id,km:q.km+first.km+last.km,minutes:(q.serviceMinutes||q.km/MODES[mode].speed*60)+first.minutes+last.minutes,waitMinutes:(q.serviceInterval||MODES[mode].wait)+(q.boardingMinutes||0),fare:MODES[mode].base+MODES[mode].perKm*q.km+(first.cash||0)+(last.cash||0),source:q.source,priority});
  }
  const shortWalk=distance(start.coordinates,end.coordinates)<8?n.route(start,end,'walk'):null;
  if(shortWalk&&shortWalk.km<10)candidates.push({mode:'walk',from:start.id,to:end.id,km:shortWalk.km,minutes:shortWalk.km/4.5*60,waitMinutes:0,fare:0,source:shortWalk.source,priority:0});
  const chosen=candidates.sort((a,b)=>a.priority-b.priority||a.minutes-b.minutes)[0];if(!chosen)problems.push(r.id+' NO CONNECTION '+i+' '+r.cities[i].name+' → '+r.cities[i+1].name);r.connections.push(chosen||null);
 }
 fs.writeFileSync(file,JSON.stringify(data));console.log(r.id,r.connections.map(c=>c?.mode||'MISSING').join(','));
}
fs.writeFileSync(folder+'/connected-catalogue.json',JSON.stringify(routes));fs.writeFileSync(folder+'/connection-problems.json',JSON.stringify(problems,null,2));console.log('Connection problems',problems.length);problems.forEach(p=>console.log(p));process.exitCode=problems.length?1:0;
