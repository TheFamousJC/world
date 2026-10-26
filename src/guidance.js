import {cipherEntry} from './ciphers.js';
import {detoursComplete} from './engine.js';
import {documentCleared} from './pilot.js';
import {pickupState} from './pickups.js';

// Presentation only: choosing a suggested action never advances the game here.
export function nextStep(state,scenario,find,{running=true,plan=[],blocked=false,airports=[]}={}){
 if(['won','lost'].includes(state.phase))return {kind:'done',label:'Run complete',detail:state.phase==='won'?'Your escape is complete.':'Review the result before trying another route.'};
 if(!running)return {kind:'resume',label:'Resume game',detail:'The clock is paused. Resume when you are ready.'};
 if(state.phase==='travelling')return {kind:'travel',label:'Journey in progress',detail:'Your committed journey is travelling to the next stop.'};
 if(state.phase==='checkpoint')return {kind:'continue',label:'Continue to operation '+(scenario.stage+2),detail:'Your time, cash, energy and items carry forward.'};
 const complete=detoursComplete(state,scenario),tasks=scenario.detours||[];
 if(scenario.pilot&&!documentCleared(state,scenario)&&(complete||scenario.stage===2&&state.completedTasks?.includes(tasks[0]?.id)))return {kind:'document',label:'Check travel documents',detail:'Open the Field desk and match the evidence from your collected items.'};
 const task=complete?null:tasks.find(t=>!state.completedTasks?.includes(t.id));
 if(task?.cipher&&cipherEntry(state,task.id)?.solvedAt===null)return {kind:'decode',task:task.id,label:'Decode collected packet',detail:'Use the OSINT workbench to extract its code. The next mission stays concealed.'};
 if(task){
  const number=tasks.indexOf(task)+1,where=pickupState(state,task,find);
  if(where.at&&!where.locked)return {kind:'collect',task:task.id,label:task.title,detail:'You are at '+find(task.place).name+'. This action takes '+task.minutes+' game minutes.'};
 }
 let target=task?.place||scenario.goal,label=task?'mission '+(tasks.indexOf(task)+1):'destination',travelDetail='';
 const from=find(state.position),destination=find(target);
 if(from?.hub&&destination?.hub&&from.hub!==destination.hub){
  const departure=airports.find(p=>p.hub===from.hub),arrival=airports.find(p=>p.hub===destination.hub);
  if(departure&&arrival){target=state.position===departure.id?arrival.id:departure.id;label=target===arrival.id?'arrival airport (flight)':'departure airport';travelDetail='Reach '+departure.name+', fly to '+arrival.name+', then continue to '+destination.name+'.';}
 }
 const queued=plan.findIndex(leg=>leg.to===target),name=find(target)?.name||target;
 if(queued>=0)return {kind:'review',target,label:'Review route to '+label,detail:name+' is already stop '+(queued+1)+'. Review its estimate, then press Go.'};
 if(blocked)return {kind:'replace',target,label:'Replace blocked plan via '+label,detail:'Replan from your actual position to '+name+'. Completed travel is kept.'};
 return {kind:'plan',target,label:'Plan route to '+label,detail:travelDetail||(task?task.title+' at ':'All mission codes verified. Continue to ')+name+'.'};
}
