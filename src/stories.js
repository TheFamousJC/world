import {pilotConfig} from './pilot.js';
import {STORY_DATA} from './story-data.js';
import {CORRIDORS} from './world-places.js';
const local=[['central','terespol','workshop','aid','north','pickup'],['terespol','koroszczyn','lodge','west-gate','kobylany','neple'],['koroszczyn','malaszewicze','terespol','kobylany','lodge','west-gate'],['malaszewicze','zalesie','chotylow','dobryn','railhideout','meadow'],['zalesie','biala','horbow','west-cache','townhub','dobryn']];
export function buildStories(base){return Object.freeze(STORY_DATA.map((d,i)=>{
 const global=i>=10,corridor=global?CORRIDORS[Math.floor((i-10)/5)]:null;
 const p=(h,j)=>`${corridor.id}-${h}-${j}`;
 const layout=global?[[p(0,0),p(0,3),p(0,1),p(0,2),p(0,6),p(0,7)],[p(0,3),p(0,5),p(0,4),p(0,0),p(0,6),p(0,7)],[p(0,5),p(1,0),p(0,2),p(1,1),p(0,6),p(1,7)],[p(1,0),p(1,3),p(1,2),p(1,4),p(1,6),p(1,7)],[p(1,3),p(1,8),p(1,0),p(1,1),p(1,6),p(1,7)]]:local.map(row=>[...row]);
 // Vary pickup geography within each corridor, not only the dossier text.
 const localPools=[['workshop','aid','north','polski','pickup'],['lodge','west-gate','kobylany','malaszewicze','railhideout'],['lodge','west-gate','kobylany','terespol','railhideout','meadow'],['chotylow','dobryn','railhideout','meadow','horbow','townhub'],['horbow','west-cache','townhub','dobryn','chotylow','meadow']];
 for(let stage=0;stage<5;stage++){
  const row=layout[stage],variant=global?(i-10)%5:i;
  if(!global){const pool=localPools[stage].filter(id=>id!==row[0]&&id!==row[1]);const first=Math.floor(variant/(pool.length-1))%pool.length,second=(first+1+variant%(pool.length-1))%pool.length,chosen=[pool[first],pool[second]],spares=pool.filter(id=>!chosen.includes(id));row.splice(2,4,...chosen,...spares.slice(0,2));}
  else if(stage===2){row[2]=p(0,5);row[3]=p(1,[1,2,3,4,8][variant]);row[4]=p(1,6);}
  else {const hub=stage<2?0:1,pool=[0,1,2,3,4,8].map(j=>p(hub,j)).filter(id=>id!==row[0]&&id!==row[1]);const first=Math.floor(variant/(pool.length-1))%pool.length,second=(first+1+variant%(pool.length-1))%pool.length;row[2]=pool[first];row[3]=pool[second];}
 }
 const operations=layout.map(([start,goal,a,b,cash,energy],stage)=>{
  const id=d.id+'-op-'+(stage+1),effort=1+stage*.08+(d.level-1)*.03;
  const detours=[a,b].map((place,j)=>({id:id+'-mission-'+(j+1),place,title:'Collect '+d.items[stage*2+j],minutes:4+stage*2+j,reward:0,energy:0,items:[d.items[stage*2+j]],requires:j?[id+'-mission-1']:[]}));
  const bonuses=[{id:id+'-cash',place:cash,title:'Collect contingency cash',kind:'cash',minutes:10+stage,reward:global?70:30,energy:0},{id:id+'-energy',place:energy,title:'Food and recovery',kind:'energy',minutes:12+stage,reward:0,energy:45}];
  return Object.freeze({...base,pilot:pilotConfig(d.id,stage),id,storyId:d.id,campaign:d.id,number:stage+1,stage,stageCount:5,start,goal,deadline:1440,budget:global?280-(d.level-1)*15:350-d.level*10,energy:100,allDetours:true,detours,bonuses,modes:global?['walk','cycle','taxi','bus','flight']:base.modes,closedModes:stage>=3&&d.layout%2?['cycle']:[],crossingDelay:25+stage*10,travelFactor:effort,effortFactor:effort,global,detailed:global,mapRevision:global?3:1,corridor:corridor?.id,region:global?corridor.region:'Brest–Biała Podlaska',title:d.chapters[stage],subtitle:d.title+' · Operation '+(stage+1)+' / 5',difficulty:['Orientation','Resource pressure','Connection pressure','Fatigue','Final handoff'][stage],story:d.chapters[stage]+'. Complete both numbered missions in order, then reach the operation destination. '+(global&&stage===2?'Reach the departure air terminal, fly to the other city’s terminal, then continue on the ground. ':'')+'Cash, energy and the same 24-hour clock carry into the next operation.',hint:'Collect both numbered items in order. Optional cash and food contacts are marked separately. '+(global&&stage===2?'Flights only run between this corridor’s air terminals. Allow 45 minutes for boarding.':'Each later operation increases journey time and mission work. Recover before your energy runs low.')});
 });
 return Object.freeze({...d,global,detailed:global,region:global?corridor.region:'Brest–Biała Podlaska',routeLabel:global?corridor.cities.map(c=>c.name).join(' → '):'Brest → Biała Podlaska',operations:Object.freeze(operations)});
}));}
