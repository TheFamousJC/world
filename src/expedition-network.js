// Expedition-only service layer. Physical roads remain the attributed native graph.
import {Network} from './network.js';
import {distance,lineLength} from './geo.js';
export class ExpeditionNetwork extends Network {
 constructor(data){super(data);this.expedition=data.metadata.expedition;}
 route(from,to,mode,avoid=[]){
  if(!from||!to||from.id===to.id||from.unreachableReason||to.unreachableReason)return null;
  const a=from.cityIndex,b=to.cityIndex,same=Number.isInteger(a)&&a===b,crossing=from.countryCode!==to.countryCode;
  if(mode==='flight'){
   if(from.kind!=='airport'||to.kind!=='airport'||!Number.isInteger(a)||!Number.isInteger(b)||Math.abs(a-b)!==1||distance(from.coordinates,to.coordinates)<20)return null;
   const coordinates=Array.from({length:81},(_,i)=>{const t=i/80;return [from.coordinates[0]+(to.coordinates[0]-from.coordinates[0])*t,from.coordinates[1]+(to.coordinates[1]-from.coordinates[1])*t+Math.sin(Math.PI*t)*Math.min(2,distance(from.coordinates,to.coordinates)/1800)];});
   return {coordinates,km:lineLength(coordinates),access:0,crossing,serviceMinutes:Math.ceil(distance(from.coordinates,to.coordinates)/650*60),serviceInterval:240,boardingMinutes:60,source:'Fictional game flight between real airfields'};
  }
  if(['train','boat','ferry'].includes(mode)){
   const service=this.expedition.services.find(s=>s.mode===mode&&(s.from===from.id&&s.to===to.id||s.to===from.id&&s.from===to.id));if(!service)return null;
   return {...service,coordinates:service.from===from.id?service.coordinates:[...service.coordinates].reverse(),crossing,access:0,serviceMinutes:service.minutes,serviceInterval:mode==='train'?120:180,boardingMinutes:mode==='train'?15:25};
  }
  if(mode==='coach'){
   if(from.serviceType!=='coach'||to.serviceType!=='coach'||Math.abs(a-b)!==1)return null;
   const index=Math.min(a,b),leg=this.expedition.roadLegs[index];if(!leg)return null;
   const first={id:'road-start-'+index,coordinates:leg.coordinates[0]},last={id:'road-end-'+index,coordinates:leg.coordinates.at(-1)};
   const transfer=(x,y)=>{const drive=this.ground(x,y,'taxi',avoid);if(drive)return drive;const walk=this.ground(x,y,'walk',avoid);return walk?{...walk,access:walk.km}:null;};
   const depart=a<b?first:last,arrive=a<b?last:first,p=transfer(from,depart),q=transfer(arrive,to);if(!p||!q)return null;
   return {coordinates:[...p.coordinates,...(a<b?leg.coordinates:[...leg.coordinates].reverse()).slice(1),...q.coordinates.slice(1)],km:p.km+leg.km+q.km,access:(p.access||0)+(q.access||0),crossing,serviceMinutes:Math.ceil(leg.minutes*1.22+(p.km+q.km-(p.access||0)-(q.access||0))/25*60),serviceInterval:90,boardingMinutes:12,transfers:leg.ferryMinutes>0?'Coach + ferry transfer included':null,source:leg.source};
  }
  // Local shuttles do not become an unlimited intercity express service.
  if(mode==='bus'&&!same)return null;
  return this.ground(from,to,mode,avoid);
 }
 ground(from,to,mode,avoid=[]){if(distance(from.coordinates,to.coordinates)<.001)return {coordinates:[from.coordinates,to.coordinates],km:distance(from.coordinates,to.coordinates),access:0,crossing:false,source:'Same interchange'};const r=super.route(from,to,mode,avoid);return r?{...r,crossing:!!(from.countryCode&&to.countryCode&&from.countryCode!==to.countryCode)}:null;}
}
