import {placeById,PLACES} from './places.js';
export function buildPursuitRoad(network,fromId,toId){
 const from=placeById(fromId),to=placeById(toId);if(!from||!to||!network)return null;
 if(fromId===toId)return {from:fromId,to:toId,coordinates:[from.coordinates,to.coordinates],km:0,minutes:0};
 const ground=(a,b)=>{if(a.id===b.id)return {coordinates:[a.coordinates],km:0,minutes:0};let route=network.route(a,b,'taxi'),speed=18;if(!route){route=network.route(a,b,'walk');speed=4.5;}return route?{coordinates:route.coordinates,km:route.km,minutes:Math.ceil(route.km/speed*60)}:null;};
 let parts;
 if(from.expedition&&to.expedition&&from.hub===to.hub&&from.cityIndex!==to.cityIndex){
  const direction=to.cityIndex>from.cityIndex?1:-1;parts=[];let current=from;
  for(let city=from.cityIndex;city!==to.cityIndex;city+=direction){
   const departures=PLACES.filter(p=>p.hub===from.hub&&p.cityIndex===city&&p.serviceType),arrivals=PLACES.filter(p=>p.hub===from.hub&&p.cityIndex===city+direction&&p.serviceType);let best=null;
   for(const a of departures)for(const b of arrivals)for(const mode of ['coach','train','flight','boat','ferry','walk']){const r=network.route(a,b,mode);if(!r||mode==='walk'&&r.km>30)continue;const first=ground(current,a),arrival=city+direction===to.cityIndex?to:PLACES.find(p=>p.id===from.hub+'-c'+(city+direction)+'-p0'),last=arrival&&ground(b,arrival);if(!first||!last)continue;const candidate=[first,{coordinates:r.coordinates,km:r.km,minutes:(r.serviceMinutes||Math.ceil(r.km/(mode==='walk'?4.5:40)*60))+60},last];const minutes=candidate.reduce((n,p)=>n+p.minutes,0);if(!best||minutes<best.minutes)best={parts:candidate,minutes,to:arrival};}
   if(!best)return null;parts.push(...best.parts);current=best.to;
  }
  parts.push(ground(current,to));
 }else if(from.hub!==to.hub){if(!from.hub||!to.hub||from.corridor!==to.corridor)return null;const a=PLACES.find(p=>p.hub===from.hub&&p.kind==='airport'),b=PLACES.find(p=>p.hub===to.hub&&p.kind==='airport'),air=a&&b&&network.route(a,b,'flight');if(!air)return null;parts=[ground(from,a),{coordinates:air.coordinates,km:air.km,minutes:90+Math.ceil(air.km/650*60)},ground(b,to)];}else parts=[ground(from,to)];
 if(parts.some(p=>!p))return null;return {from:fromId,to:toId,coordinates:parts.flatMap((p,i)=>i?p.coordinates.slice(1):p.coordinates),km:parts.reduce((n,p)=>n+p.km,0),minutes:parts.reduce((n,p)=>n+p.minutes,0)};
}
