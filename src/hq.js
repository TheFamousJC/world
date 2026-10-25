// Contextual HQ guidance is presentation only: no fares, routing or state changes.
import {pickupState} from './pickups.js';
export function hqBrief(state,scenario,find){
 const notes=[],tasks=scenario.detours||[],next=tasks.find(t=>!state.completedTasks?.includes(t.id)),left=Math.max(0,Math.ceil(scenario.deadline-state.elapsed));
 const counter=tasks.find(t=>t.closesAt!==undefined&&!state.completedTasks.includes(t.id));if(counter&&state.elapsed+counter.minutes>counter.closesAt)notes.push('The deposit can no longer finish before the counter closes. Restart the courier pilot to try a different plan.');
 if(scenario.shuttle)notes.push('Shuttle stops: '+scenario.shuttle.stops.map(id=>find(id)?.name||id).join(' → ')+'. £'+scenario.shuttle.fare+', every '+scenario.shuttle.interval+' minutes; '+scenario.shuttle.boarding+'-minute boarding. Only these stops accept boarding and alighting.');
 if(counter)notes.push('Deposit takes '+counter.minutes+' minutes and must finish by T+'+counter.closesAt+'. The sealed documents are exchanged for a receipt.');
 if(next){const status=pickupState(state,next,find),where=find(next.place)?.name||next.place;notes.push(status.at&&!status.locked?'You are at '+where+'. Complete “'+next.title+'” before leaving.':'Next objective: '+next.title+' at '+where+'. You choose the route and transport.');}
 else notes.push((scenario.deliveryPilot?'Documents deposited; receipt confirmed. ':tasks.length?'Both mission items are collected. ':'')+'Your destination is '+(find(scenario.goal)?.name||scenario.goal)+'.');
 if(state.energy<30)notes.push('Energy is low. Check recovery contacts or rest before committing to a long walk.');
 if(state.cash<15){const bonus=scenario.bonuses?.find(t=>t.kind==='cash'&&!state.completedTasks?.includes(t.id));notes.push(bonus?'Cash is low. An uncollected cash contact is at '+(find(bonus.place)?.name||bonus.place)+'.':'Cash is low. Compare the full fare and preserve enough for the remaining operations.');}
 if(left<=Math.max(30,scenario.deadline*.15))notes.push('Time is tight: '+left+' game minutes remain. Include waits, checks and mission actions when comparing journeys.');
 if(scenario.closeAt!==null&&scenario.closeAt!==undefined)notes.push(state.elapsed>=scenario.closeAt?'The scenario crossing window is closed. Reconsider routes that require it.':'The crossing window closes in '+Math.max(0,Math.ceil(scenario.closeAt-state.elapsed))+' game minutes.');
 if(scenario.closedModes?.includes('bus'))notes.push('Shuttles are suspended in this scenario. Review the other available transport modes.');
 if(scenario.pilot)notes.push('Service intelligence may be unverified. Use the HQ operations desk to verify dispatch and check your documents.');
 return notes;
}
