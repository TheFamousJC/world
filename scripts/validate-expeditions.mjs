// Validation planner only: production never selects or solves a player's route.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {Network} from '../src/network.js';
import {WorldNetwork} from '../src/world-network.js';
import {STORIES,ALL_SCENARIOS,placeById} from '../src/scenarios.js';
import {newGame,quoteJourney,depart,arrive,reviewArrival,completeDetour,cipherAction,collectBonus,advanceStage,journeyCost,makeSave,readSave,action} from '../src/engine.js';
import {safePursuitLeg,safePursuitAction} from '../src/pursuit-validation.js';
import {cipherCase} from '../src/ciphers.js';
export function expeditionNetwork(story){const n=new WorldNetwork(new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url)))));n.installRegion(story.id,JSON.parse(fs.readFileSync(new URL('../public/data/'+story.id+'.geojson',import.meta.url))));return n;}
export function simulateExpedition(story,n,strategy='fast',snapshots=false,onOperationReady=null){let c=story.operations[0],s=newGame(c,story.id+'-'+strategy),legs=[],steps=[],checkpoints=[],packets=[];
 const localModes=strategy==='frugal'?['cycle','tuktuk','cart','horse','camel','bus','walk','taxi']:['taxi','bus','walk'];
 const local=(a,b)=>{if(a.id===b.id)return [];for(const mode of localModes){if(!c.modes.includes(mode))continue;const route=n.route(a,b,mode);if(route&&journeyCost(route,mode,c,s.elapsed,s.energy).energyAfter>=0)return [{to:b.id,mode}];}return null;};
 const leg=(to,mode)=>{s=reviewArrival(s);if(s.energy<20){s=safePursuitAction(s,c,20);const rest=action(s,c,'rest');if(rest.ok){s=rest.state;steps.push({type:'rest'});}}const safe=safePursuitLeg(s,c,n,to,mode);s=safe.state;const q=safe.quote;if(!q.ok)throw Error(c.id+' '+mode+' → '+to+': '+q.code+' '+q.message);const before=s,departure=depart(s,q);if(!departure.ok)throw Error(departure.message);s=arrive(departure.state,c);if(s.cash!==before.cash-q.cash||s.elapsed!==before.elapsed+q.minutes)throw Error('Incorrect resource settlement');if(s.phase==='lost')throw Error(c.id+' intercepted on arrival at '+to);legs.push({to,mode:safe.mode});steps.push({type:'travel',to,mode:safe.mode});s=reviewArrival(s);};
 const go=target=>{const a=placeById(s.position),b=placeById(target);if(a.id===b.id)return;
  if(a.cityIndex!==b.cityIndex){const connection=c.connection||{from:story.id+'-c'+a.cityIndex+'-p1',to:story.id+'-c'+b.cityIndex+'-p0',mode:'coach'};const first=local(a,placeById(connection.from));if(!first)throw Error('No departure access '+a.name);for(const step of first)leg(step.to,step.mode);leg(connection.to,connection.mode);}
  const tail=local(placeById(s.position),b);if(!tail)throw Error('No local access '+placeById(s.position).name+' → '+b.name);for(const step of tail)leg(step.to,step.mode);
 };
 for(const operation of story.operations){c=operation;
  for(const task of c.detours){go(task.place);s=reviewArrival(s);s=safePursuitAction(s,c,task.minutes);const collected=completeDetour(s,c,task.id,{},n);if(!collected.ok||collected.state.phase==='lost')throw Error(c.id+' '+collected.message);s=collected.state;steps.push({type:'collect',id:task.id});if(snapshots)packets.push({id:task.id,state:structuredClone(s)});const decoded=cipherAction(s,c,task.id,'solve',cipherCase(task).answer);if(!decoded.ok)throw Error(decoded.message);s=decoded.state;steps.push({type:'solve',id:task.id});}
  for(const bonus of c.bonuses){go(bonus.place);s=reviewArrival(s);s=safePursuitAction(s,c,bonus.minutes);const r=collectBonus(s,c,bonus.id);if(!r.ok){if(bonus.kind==='energy'&&s.energy===100)continue;throw Error(r.message);}s=r.state;steps.push({type:'bonus',id:bonus.id});}
  if(onOperationReady){const changed=onOperationReady(s,c,n);s=changed.state;steps.push(...changed.steps);}
  go(c.goal);const saved=readSave(makeSave({game:s,plan:[],custom:{},clockRunning:false}),ALL_SCENARIOS);if(!saved)throw Error(c.id+' Save rejected');s=saved.game;checkpoints.push({scenario:c.id,cash:s.cash,energy:s.energy,elapsed:s.elapsed,traceCount:s.pursuit.traces.length,caseCount:Object.values(s.cipher.cases).filter(e=>e.solvedAt!==null).length,...(snapshots?{state:structuredClone(s)}:{})});
  if(c.stage<4){const before=s;s=advanceStage(s,c,story.operations[c.stage+1]);if(s.elapsed!==before.elapsed||s.cash!==before.cash||s.energy!==before.energy||JSON.stringify(s.pursuit.traces)!==JSON.stringify(before.pursuit.traces))throw Error('Resources or pursuit reset at operation boundary');steps.push({type:'continue'});}
 }
 if(s.phase!=='won')throw Error('Missing extraction');return {id:story.id,strategy,state:s,legs,steps,checkpoints,packets};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const selected=process.argv[2],results=[],issues=[];for(const story of STORIES){if(selected&&story.id!==selected)continue;const n=expeditionNetwork(story);for(const strategy of ['fast','frugal'])try{const run=simulateExpedition(story,n,strategy,!!selected);results.push(selected?run:{id:story.id,strategy,elapsed:run.state.elapsed,cash:run.state.cash,legs:run.legs.length});console.log('PASS',story.id,strategy,run.state.elapsed,run.state.cash);}catch(e){issues.push({id:story.id,strategy,message:e.message});console.log('FAIL',story.id,strategy,e.message);}}fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/world-validation'+(selected?'-'+selected:'')+'.json',JSON.stringify({results,issues},null,2));process.exitCode=issues.length?1:0;}
