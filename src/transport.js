import {placeById} from './places.js';
// Authored fixed-stop service; game routes follow the road graph between stops.
export function travelRoute(c,network,from,to,mode){
 if(mode!=='bus'||!c.shuttle)return network.route(from,to,mode,c.avoidWays||[]);
 const stops=c.shuttle.stops,a=stops.indexOf(from.id),b=stops.indexOf(to.id);if(a<0||b<0||a===b)return null;
 const direction=b>a?1:-1,parts=[];for(let i=a;i!==b;i+=direction){const r=network.route(placeById(stops[i]),placeById(stops[i+direction]),mode,c.avoidWays||[]);if(!r)return null;parts.push(r);}
 return {coordinates:parts.flatMap((r,i)=>i?r.coordinates.slice(1):r.coordinates),km:parts.reduce((s,r)=>s+r.km,0),access:parts.reduce((s,r)=>s+(r.access||0),0),crossing:parts.some(r=>r.crossing),source:'Authored shuttle line on offline roads',shuttleFrom:a,shuttleTo:b,shuttleStops:Array.from({length:Math.abs(b-a)+1},(_,i)=>stops[a+i*direction])};
}
export function shuttleCost(c,route,elapsed,state){
 if(!c.shuttle||route.shuttleFrom===undefined)return null;
 const s=c.shuttle,offset=(route.shuttleTo>route.shuttleFrom?s.forward:s.reverse)[route.shuttleFrom],ready=elapsed+s.boarding,departure=s.first+offset+Math.max(0,Math.ceil((ready-s.first-offset)/s.interval))*s.interval;
 if(departure>s.last+offset)return {error:'The last shuttle from this stop has left. Choose another available transport.',wait:0};
 const inspectionDelay=state?.inventory?.includes('sealed courier documents')?s.inspection:0;
 return {wait:departure-elapsed,cash:s.fare,inspectionDelay,schedule:{departure,wait:departure-elapsed,boarding:s.boarding,interval:s.interval,last:s.last+offset}};
}
export function courierExpired(state,c){return !!(c.deliveryPilot||c.thriller)&&c.detours.some(t=>t.closesAt!==undefined&&!state.completedTasks?.includes(t.id)&&state.elapsed+t.minutes>t.closesAt);}
export function validCourierSave(state,c){if(!c.deliveryPilot)return true;const a=state.completedTasks.includes('courier-pickup'),b=state.completedTasks.includes('courier-deposit');return (!b||a)&&state.inventory.includes('sealed courier documents')===(a&&!b)&&state.inventory.includes('deposit receipt')===b&&(state.phase!=='won'||b);}
