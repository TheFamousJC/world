import {placeById,PLACES} from './places.js';
export function buildPursuitRoad(network,fromId,toId){
 const from=placeById(fromId),to=placeById(toId);if(!from||!to||!network)return null;
 if(fromId===toId)return {from:fromId,to:toId,coordinates:[from.coordinates,to.coordinates],km:0,minutes:0};
 const ground=(a,b)=>{if(a.id===b.id)return {coordinates:[a.coordinates],km:0,minutes:0};let route=network.route(a,b,'taxi'),speed=18;if(!route){route=network.route(a,b,'walk');speed=4.5;}return route?{coordinates:route.coordinates,km:route.km,minutes:Math.ceil(route.km/speed*60)}:null;};
 let parts;if(from.hub!==to.hub){if(!from.hub||!to.hub||from.corridor!==to.corridor)return null;const a=PLACES.find(p=>p.hub===from.hub&&p.kind==='airport'),b=PLACES.find(p=>p.hub===to.hub&&p.kind==='airport'),air=a&&b&&network.route(a,b,'flight');if(!air)return null;parts=[ground(from,a),{coordinates:air.coordinates,km:air.km,minutes:90+Math.ceil(air.km/650*60)},ground(b,to)];}else parts=[ground(from,to)];
 if(parts.some(p=>!p))return null;return {from:fromId,to:toId,coordinates:parts.flatMap((p,i)=>i?p.coordinates.slice(1):p.coordinates),km:parts.reduce((n,p)=>n+p.km,0),minutes:parts.reduce((n,p)=>n+p.minutes,0)};
}
