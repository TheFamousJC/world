import {PURSUIT_ROADS} from './pursuit-roads.js';
import {placeById} from './places.js';
import {distance,pointAlong} from './geo.js';
import {courierExpired} from './transport.js';
export const PURSUIT_RULES=Object.freeze({base:'north',response:8,speed:18,search:12,grace:5,radius:.35});
export const HIDES=Object.freeze([{place:'workshop',title:'Workshop back room',minutes:12,cash:2,energy:8,requires:'sealed courier documents'},{place:'aid',title:'Riverside safe house',minutes:12,cash:2,energy:15,requires:'deposit receipt'},{place:'central',title:'Station luggage alcove',minutes:10,cash:0,energy:0}]);
export const newPursuit=()=>({version:1,traces:[],ack:[],usedHides:[],caught:false});
export function searchWindows(p){
 let from=PURSUIT_RULES.base,free=0;return (p?.traces||[]).map(t=>{const road=from===t.place?null:PURSUIT_ROADS[from+':'+t.place],depart=Math.max(free,t.at+PURSUIT_RULES.response),arrival=depart+(road?Math.ceil(road.km/PURSUIT_RULES.speed*60):0),until=arrival+PURSUIT_RULES.search,event={...t,from,depart,arrival,catchAt:arrival+PURSUIT_RULES.grace,until,road};from=t.place;free=until;return event;});
}
export function addTrace(state,id,place,source){
 if(!state.pursuit||state.pursuit.traces.some(t=>t.id===id))return;
 state.pursuit.traces.push({id,place,source,at:state.elapsed});
}
const near=(position,e,custom={})=>{const p=custom[position]||placeById(position);return p&&distance(p.coordinates,placeById(e.place).coordinates)<=PURSUIT_RULES.radius;};
export function interception(p,position,start,end,custom={}){return searchWindows(p).find(e=>near(position,e,custom)&&end>=e.catchAt&&start<e.until);}
// Searches apply to reported areas and stationary stops, never to an unseen moving traveller.
export function applyPursuit(state,scenario,start,position=state.position,custom={},hidden=false){
 if(!scenario.pursuit||hidden||state.phase==='lost')return state;
 const event=interception(state.pursuit,position,start,state.elapsed,custom);if(!event)return state;
 state.phase='lost';state.pursuit.caught=true;state.history.unshift({at:state.elapsed,type:'interception',message:'Intercepted in the reported '+placeById(event.place).name+' search area. HQ warned at T+'+Math.floor(event.at)+'. Leave earlier or use a hiding place.'});state.history=state.history.slice(0,50);return state;
}
export function pursuitTravelWarning(state,to,mode,cost,custom={}){if(!state.pursuit)return '';const forecast=structuredClone(state);if(mode==='bus')addTrace(forecast,'ticket:'+(state.sequence+1),state.position,'Named shuttle ticket');if(interception(forecast.pursuit,state.position,state.elapsed,state.elapsed+(cost.waitMinutes||0),custom))return 'HQ: a reported search overlaps boarding. Hide or change transport before Go.';if(interception(forecast.pursuit,to,state.elapsed+cost.minutes,state.elapsed+cost.minutes,custom))return 'HQ: arrival falls inside a reported search. Choose another stop or time.';return '';}
export function pursuitReports(state){return searchWindows(state.pursuit).flatMap(e=>[{id:e.id,at:e.at,text:e.source+' reported '+placeById(e.place).name+'. Search expected T+'+Math.floor(e.arrival)+'–'+Math.ceil(e.until)+'. Leave the area or hide before T+'+Math.floor(e.catchAt)+'. Source: contact network · confidence: expected.'},...(state.elapsed>=e.arrival&&state.elapsed<e.until?[{id:e.id+':search',at:e.arrival,text:'Search active near '+placeById(e.place).name+' until T+'+Math.ceil(e.until)+'. Five-minute warning grace ends at T+'+e.catchAt+'. Source: local observer · confidence: confirmed.'}]:[])]).sort((a,b)=>b.at-a.at);}
export function acknowledgePursuit(state){const s=structuredClone(state);if(s.pursuit)s.pursuit.ack=[...new Set([...s.pursuit.ack,...pursuitReports(s).map(r=>r.id)])];return s;}
export function hideQuote(state,c,custom={}){
 const h=c.pursuit&&HIDES.find(h=>h.place===state.position||custom[state.position]&&distance(custom[state.position].coordinates,placeById(h.place).coordinates)<=.15),fail=message=>({ok:false,message});if(!h)return fail('This stop has no trusted hiding place. HQ lists the available shelters.');
 if(!['planning','arrived'].includes(state.phase))return fail('Finish travelling before hiding.');if(state.pursuit.usedHides.includes(h.place))return fail('This hiding place has already been used. Choose your next move.');if(h.requires&&!state.inventory.includes(h.requires))return fail('Access requires '+h.requires+'. Complete the contact action first.');
 const windows=searchWindows(state.pursuit).filter(e=>near(h.place,e)&&e.until>=state.elapsed),end=Math.max(state.elapsed+h.minutes,...windows.map(e=>e.until+1)),minutes=Math.ceil(end-state.elapsed);
 if(state.cash<h.cash)return fail('This shelter costs £'+h.cash+'. You do not have enough cash.');if(state.elapsed+minutes>=c.deadline||courierExpired({...state,elapsed:state.elapsed+minutes},c))return fail('Waiting out this search would miss a mission deadline. Leave by another route instead.');
 return {ok:true,...h,minutes,message:h.title+' · '+minutes+' min · £'+h.cash+' · +'+h.energy+'% energy. Stay until the reported local search has passed. This uses the shared countdown.'};
}
export function hidePursuit(state,c,custom={}){const q=hideQuote(state,c,custom);if(!q.ok)return {...q,state};const s=structuredClone(state);s.elapsed+=q.minutes;s.cash-=q.cash;s.energy=Math.min(100,s.energy+q.energy);s.pursuit.usedHides.push(q.place);s.history.unshift({at:s.elapsed,type:'hiding',message:q.title+': '+q.minutes+' minutes and £'+q.cash+' spent. Local search passed; future traces can expose you again.'});s.history=s.history.slice(0,50);return {ok:true,state:s,message:'You waited out the reported search. '+q.minutes+' minutes and £'+q.cash+' spent. Choose your next move.'};}
export function pursuitPosition(p,at){let position=placeById(PURSUIT_RULES.base).coordinates;for(const e of searchWindows(p)){if(at<e.depart)return position;if(at<e.arrival)return pointAlong(e.road.coordinates,(at-e.depart)/(e.arrival-e.depart));position=placeById(e.place).coordinates;}return position;}
export function validPursuit(s,c){if(!c.pursuit)return true;const p=s.pursuit;if(!p||p.version!==1||!Array.isArray(p.traces)||p.traces.length>40||!Array.isArray(p.ack)||!Array.isArray(p.usedHides)||typeof p.caught!=='boolean'||p.caught&&s.phase!=='lost')return false;const ids=new Set();let at=-1;for(const t of p.traces){if(!t||typeof t.id!=='string'||ids.has(t.id)||!['north','central','workshop','aid','pickup'].includes(t.place)||typeof t.source!=='string'||!Number.isFinite(t.at)||t.at<at||t.at>s.elapsed)return false;ids.add(t.id);at=t.at;}return p.ack.every(id=>typeof id==='string'&&(ids.has(id)||id.endsWith(':search')&&ids.has(id.slice(0,-7))))&&new Set(p.usedHides).size===p.usedHides.length&&p.usedHides.every(id=>HIDES.some(h=>h.place===id));}
