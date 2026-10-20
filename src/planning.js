import {arrive} from './engine.js';

export const MAX_LEGS=20;
export const anchorId=session=>session.plan.at(-1)?.to||session.game.position;

// Selecting points never changes the player's position or skips an earlier leg.
export function selectMapPoint(session,point){
 if(!['planning','arrived'].includes(session.game.phase))return session;
 const next=structuredClone(session),from=anchorId(next);
 if(point.kind==='waypoint')next.custom[point.id]=point;
 next.draft={from,to:point.id===from?null:point.id,mode:null};
 next.clockRunning=true;
 return next;
}

// Settle both travel and its queue in one saved transaction. Reload is idempotent.
export function settleLeg(session,scenario){
 if(session.game.phase!=='travelling'||!session.game.pending)return session;
 const next=structuredClone(session),to=next.game.pending.to;
 next.game=arrive(next.game,scenario);
 if(next.plan[0]?.to===to)next.plan.shift();
 next.travelRemaining=Math.max(0,(next.travelRemaining||1)-1);
 if(['won','lost'].includes(next.game.phase))next.travelRemaining=0;
 next.draft=null;
 return next;
}

export function sectionLength(value,plan){
 const count=value==='all'?plan.length:Number(value);
 return Number.isInteger(count)&&count>=1&&count<=plan.length?count:0;
}
