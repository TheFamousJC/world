// Test/validation planner only. Production never chooses the player's route.
import {quoteJourney,reviewArrival,action} from './engine.js';import {interception,searchWindows,hidePursuit,addTrace} from './pursuit.js';
export function safePursuitAction(state,c,minutes){if(!c.cataloguePursuit||!interception(state.pursuit,state.position,state.elapsed,state.elapsed+minutes))return state;const e=interception(state.pursuit,state.position,state.elapsed,state.elapsed+minutes),r=hidePursuit(reviewArrival(state),c,{},Math.ceil(e.until-state.elapsed+1));if(!r.ok)throw Error(r.message);return r.state;}
export function safePursuitLeg(state,c,network,to,preferred){
 if(!c.cataloguePursuit)return {state,quote:quoteJourney(state,c,network,to,preferred),mode:preferred};
 const targetTask=[...(c.detours||[]),...(c.bonuses||[])].find(t=>t.place===to&&!state.completedTasks.includes(t.id)),duration=targetTask?.minutes||0;
 const isSafe=({mode,quote:q})=>{if(!q.ok||q.pursuitWarning)return false;const forecast={...state,pursuit:{...state.pursuit,traces:[...state.pursuit.traces]}};if(mode==='bus')addTrace(forecast,'ticket:'+(state.sequence+1),state.position,'Named shuttle ticket',state.elapsed,q.pursuitTraceRoad);return !interception(forecast.pursuit,to,state.elapsed+q.minutes,state.elapsed+q.minutes+duration);};
 for(let attempt=0;attempt<16;attempt++){const first={mode:preferred,quote:quoteJourney(state,c,network,to,preferred)};if(isSafe(first))return {state,...first};
  const options=[...new Set([preferred,...c.modes])].map(mode=>({mode,quote:quoteJourney(state,c,network,to,mode)})),safe=options.filter(isSafe);
  if(safe.length){const choice=safe.find(o=>o.mode===preferred)||safe.sort((a,b)=>a.quote.minutes-b.quote.minutes)[0];return {state,...choice};}
  if(!options.some(o=>o.quote.ok||o.quote.code==='pursuit'))break;
  const waitDanger=interception(state.pursuit,state.position,state.elapsed,state.elapsed+15);const recovery=waitDanger?hidePursuit(state,c):action(state,c,'wait');if(!recovery.ok||recovery.state.phase==='lost')break;state=recovery.state;
 }
 return {state,mode:preferred,quote:quoteJourney(state,c,network,to,preferred)};
}
