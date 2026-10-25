// Contextual HQ guidance is presentation only: no fares, routing or state changes.
import {pickupState} from './pickups.js';
export function hqBrief(state,scenario,find){
 const notes=[],tasks=scenario.detours||[],next=tasks.find(t=>!state.completedTasks?.includes(t.id)),left=Math.max(0,Math.ceil(scenario.deadline-state.elapsed));
 if(next){const status=pickupState(state,next,find),where=find(next.place)?.name||next.place;notes.push(status.at&&!status.locked?'You are at '+where+'. Complete “'+next.title+'” before leaving.':'Next objective: '+next.title+' at '+where+'. You choose the route and transport.');}
 else notes.push((tasks.length?'Both mission items are collected. ':'')+'Your destination is '+(find(scenario.goal)?.name||scenario.goal)+'.');
 if(state.energy<30)notes.push('Energy is low. Check recovery contacts or rest before committing to a long walk.');
 if(state.cash<15){const bonus=scenario.bonuses?.find(t=>t.kind==='cash'&&!state.completedTasks?.includes(t.id));notes.push(bonus?'Cash is low. An uncollected cash contact is at '+(find(bonus.place)?.name||bonus.place)+'.':'Cash is low. Compare the full fare and preserve enough for the remaining operations.');}
 if(left<=Math.max(30,scenario.deadline*.15))notes.push('Time is tight: '+left+' game minutes remain. Include waits, checks and mission actions when comparing journeys.');
 if(scenario.closeAt!==null&&scenario.closeAt!==undefined)notes.push(state.elapsed>=scenario.closeAt?'The scenario crossing window is closed. Reconsider routes that require it.':'The crossing window closes in '+Math.max(0,Math.ceil(scenario.closeAt-state.elapsed))+' game minutes.');
 if(scenario.closedModes?.includes('bus'))notes.push('Shuttles are suspended in this scenario. Review the other available transport modes.');
 if(scenario.pilot)notes.push('Service intelligence may be unverified. Use the HQ operations desk to verify dispatch and check your documents.');
 return notes;
}
