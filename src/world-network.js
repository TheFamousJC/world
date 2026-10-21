import {distance,lineLength} from './geo.js';
import {WORLD_PLACES} from './world-places.js';
import {Network} from './network.js';
import {mapPackFor} from './map-packs.js';
// OSM packs power Brest and Japan; remaining hubs are explicitly schematic.
// Never invent a ground connection when a detailed pack is missing.
export class WorldNetwork{
 constructor(local){this.local=local;this.bounds=local.bounds;this.borders=local.borders;this.stats=local.stats;this.regions=new Map();}
 installRegion(hub,data){this.regions.set(hub,new Network(data));}
 route(from,to,mode,avoid=[]){
  if(!from||!to||from.unreachableReason||to.unreachableReason)return null;
  if(!from.hub&&!to.hub)return mode==='flight'?null:this.local.route(from,to,mode,avoid);
  if(!from.hub||!to.hub||from.id===to.id)return null;
  if(mode==='flight'){
   if(from.kind!=='airport'||to.kind!=='airport'||from.hub===to.hub||from.corridor!==to.corridor)return null;
   const coordinates=Array.from({length:81},(_,i)=>{const t=i/80;return [from.coordinates[0]+(to.coordinates[0]-from.coordinates[0])*t,from.coordinates[1]+(to.coordinates[1]-from.coordinates[1])*t+Math.sin(Math.PI*t)*Math.min(3,distance(from.coordinates,to.coordinates)/1800)];});
   return {coordinates,km:lineLength(coordinates),access:0,crossing:true,source:'Fictional air connection'};
  }
  if(from.hub!==to.hub||!['walk','cycle','taxi','bus'].includes(mode))return null;
  // A declared detailed region must never fall back to invented ground links.
  if(mapPackFor(from.hub))return this.regions.get(from.hub)?.route(from,to,mode,avoid)||null;
  const [a,b]=[from.coordinates,to.coordinates],coordinates=[a,[a[0],(a[1]+b[1])/2],[(a[0]+b[0])/2,(a[1]+b[1])/2],[b[0],(a[1]+b[1])/2],b];
  return {coordinates,km:lineLength(coordinates),access:0,crossing:false,source:'Schematic game ground link'};
 }
 mapPoint(coordinates,id,name){
  for(const [hub,network] of this.regions){const b=network.bounds;if(coordinates[0]>=b[0]&&coordinates[0]<=b[2]&&coordinates[1]>=b[1]&&coordinates[1]<=b[3])return {...network.mapPoint(coordinates,id,name),hub,corridor:mapPackFor(hub).corridor,mapPack:mapPackFor(hub).id};}
  const nearest=WORLD_PLACES.filter(p=>p.kind==='airport'&&!p.mapPack).map(p=>({p,d:distance(coordinates,p.coordinates)})).sort((a,b)=>a.d-b.d)[0];
  if(nearest?.d<12)return {id,name,coordinates,kind:'waypoint',hub:nearest.p.hub,corridor:nearest.p.corridor,note:'Schematic game point, not a surveyed road.'};
  return this.local.mapPoint(coordinates,id,name);
 }
}
