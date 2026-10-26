import {missionRevealed,cipherEntry} from './ciphers.js';
import {distance} from './geo.js';

export const STOP_SYMBOLS={airport:'✈',station:'▥',crossing:'⇄',shelter:'+',supply:'⚙',pickup:'⚑',waypoint:'·'};

export function pickupState(state,task,find){
 const done=!!state.completedTasks?.includes(task.id);
 const locked=!!task.requires?.some(id=>!state.completedTasks?.includes(id));
 const from=find(state.position),to=find(task.place);
 return {done,locked,at:!!from&&!!to&&distance(from.coordinates,to.coordinates)<=.15};
}

export function stopInfo(place,state,scenario){
 const tasks=scenario.detours||[],index=tasks.findIndex(t=>t.place===place.id&&missionRevealed(state,t)&&!state.completedTasks.includes(t.id)),fallback=tasks.findIndex(t=>t.place===place.id&&missionRevealed(state,t)),n=index>=0?index:fallback,task=tasks[n];
 const bonus=scenario.bonuses?.find(t=>t.place===place.id);
 const done=!!(task||bonus)&&!!state.completedTasks?.includes((task||bonus).id);
 return {
  symbol:bonus?(bonus.kind==='cash'?'£':'♡'):place.id===scenario.goal?'◎':STOP_SYMBOLS[place.kind]||'·',
  badge:task?(String(n+1)+(done?'✓':'')):'',
  label:task?(cipherEntry(state,task.id)?.solvedAt===null?'ENCRYPTED · DECODE':done?(task.cipher?'DECODED':task.kind==='deposit'?'DEPOSITED':'COLLECTED'):`MISSION ${n+1}`):bonus?(done?'COLLECTED':bonus.kind==='cash'?'OPTIONAL CASH':'OPTIONAL ENERGY'):place.id===scenario.goal?'DESTINATION':'',
  done,
  task,
  bonus
 };
}

// Essential mission stops remain visible in regional and globe views.
export function stopMarkerVisible({enabled,relevant,zoom,mission=false,airport=false,global=false}){
 return !!enabled&&!!relevant&&(mission||zoom>=9||!!global&&airport);
}
