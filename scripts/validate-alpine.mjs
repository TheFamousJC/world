import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import {Network} from '../src/network.js';
import {WorldNetwork} from '../src/world-network.js';
import {ALPINE_STORY,ALL_SCENARIOS,placeById} from '../src/scenarios.js';
import {cipherCase} from '../src/ciphers.js';
import {newGame,quoteJourney,depart,arrive,reviewArrival,advanceStage,completeDetour,cipherAction,journeyCost,makeSave,readSave,collectBonus} from '../src/engine.js';
export function validateAlpine(){
const base=new Network(JSON.parse(fs.readFileSync('public/data/region.geojson'))),issues=[],results=[];

for(const story of [ALPINE_STORY]){
 for(const strategy of ['coach','frugal']){try{const n=new WorldNetwork(base);n.installRegion(story.id,JSON.parse(fs.readFileSync('public/data/'+story.id+'.geojson')));let s=newGame(story.operations[0],story.id+'-'+strategy),c=story.operations[0],legs=0;const steps=[],checkpoints=[];
 const modes=strategy==='coach'?['taxi','bus','walk']:['cycle','bus','walk','taxi'];
 const local=(a,b)=>{if(a.id===b.id)return [];for(const mode of modes){const route=n.route(a,b,mode);if(route&&journeyCost(route,mode,c,s.elapsed,s.energy).energyAfter>=0)return [{to:b.id,mode}];}return null;};
 const go=target=>{const from=placeById(s.position),to=placeById(target);let plan;
  if(from.cityIndex===to.cityIndex)plan=local(from,to);else{let candidates=[];const a=story.places.filter(p=>p.cityIndex===from.cityIndex&&p.serviceType),b=story.places.filter(p=>p.cityIndex===to.cityIndex&&p.serviceType);for(const x of a)for(const y of b)for(const mode of ['coach','flight','train','boat','ferry']){const route=n.route(x,y,mode);if(!route)continue;const first=local(from,x),last=local(y,to);if(!first||!last)continue;candidates.push({plan:[...first,{to:y.id,mode},...last],rank:(mode==='coach'?0:mode==='train'?20000:mode==='boat'||mode==='ferry'?30000:100000)+route.km});}plan=candidates.sort((a,b)=>a.rank-b.rank)[0]?.plan;}
  if(!plan)throw Error('No itinerary '+from.name+' to '+to.name);
  for(const leg of plan){steps.push({type:'travel',...leg});const q=quoteJourney(s,c,n,leg.to,leg.mode);if(!q.ok)throw Error(leg.mode+' '+leg.to+' '+q.message);const d=depart(s,q);if(!d.ok)throw Error(d.message);s=arrive(d.state,c);legs++;if(s.phase==='lost')throw Error('Lost on arrival '+leg.to);s=reviewArrival(s);}
 };
 for(const [stage,op] of story.operations.entries()){c=op;for(const task of c.detours){go(task.place);steps.push({type:'collect',id:task.id});const r=completeDetour(s,c,task.id,{},n);if(!r.ok)throw Error(r.message);s=r.state;steps.push({type:'solve',id:task.id});const decoded=cipherAction(s,c,task.id,'solve',cipherCase(task).answer);if(!decoded.ok)throw Error(decoded.message);s=decoded.state;if(s.phase==='lost')throw Error('Pursuer intercepted at packet');}
  for(const bonus of c.bonuses){go(bonus.place);steps.push({type:'bonus',id:bonus.id});const r=collectBonus(s,c,bonus.id);if(!r.ok)throw Error(r.message);s=r.state;}
  go(c.goal);const saved=readSave(makeSave({game:s,plan:[],custom:{},clockRunning:false}),ALL_SCENARIOS);if(!saved)throw Error('Save rejected at operation '+stage);checkpoints.push(structuredClone(s));if(stage<4){steps.push({type:'continue'});const old=s;s=advanceStage(s,c,story.operations[stage+1]);if(s.elapsed!==old.elapsed||s.cash!==old.cash||JSON.stringify(s.pursuit.traces)!==JSON.stringify(old.pursuit.traces))throw Error('Resources reset');}
 }
 if(s.phase!=='won')throw Error('Not extracted');results.push({id:story.id,strategy,elapsed:s.elapsed,cash:s.cash,legs,steps,checkpoints,state:s});console.log('PASS',story.id,strategy,s.elapsed,s.cash);
 }catch(e){issues.push(story.id+' '+strategy+': '+e.message);console.log('FAIL',issues.at(-1));}}
}
return {results,issues};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const report=validateAlpine();fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/alpine-playthroughs.json',JSON.stringify(report,null,2));process.exitCode=report.issues.length?1:0;}
