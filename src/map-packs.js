// A registry of independently packaged regions. New corridors can use the same
// offline loader without replacing the globe, story engine or routing code.
export const MAP_PACKS=Object.freeze([
 {id:'osaka',hub:'world-0-0',corridor:'world-0',name:'Osaka / Itami',file:'osaka.geojson'},
 {id:'tokyo',hub:'world-0-1',corridor:'world-0',name:'Tokyo / Haneda',file:'tokyo.geojson'}
]);
export const mapPackFor=hub=>MAP_PACKS.find(p=>p.hub===hub);
// Replaced with the same content hash as the service worker at build time.
const revision='REGION_REVISION';
export async function loadCorridorPacks(corridor,network){
 const needed=MAP_PACKS.filter(p=>p.corridor===corridor&&!network.regions.has(p.hub));
 let cache=null;network.offlineStorageFailed=false;
 try{if(typeof caches!=='undefined')cache=await caches.open('escape-atlas:'+new URL('../',import.meta.url).pathname+':regions-'+revision);}catch{}
 const loaded=await Promise.all(needed.map(async p=>{
  const url=new URL('../data/'+p.file,import.meta.url).href;
  let response;try{response=(cache&&await cache.match(url))||await fetch(url);}catch{throw Error(p.name+' map pack unavailable on this device. Connect once to download it for offline play.');}
  if(!response.ok)throw Error(p.name+' map pack unavailable. Connect once to download it for offline play.');
  const copy=cache?response.clone():null,data=await response.json();
  if(data.type!=='FeatureCollection'||!data.metadata?.bounds||!data.features?.length)throw Error(p.name+' map pack is incomplete. Refresh it while online.');
  // Cache explicitly even if a first-time service worker has not claimed the page.
  if(copy){try{await cache.put(url,copy);}catch{network.offlineStorageFailed=true;}}else network.offlineStorageFailed=true;
  return [p,data];
 }));
 for(const [p,data] of loaded)network.installRegion(p.hub,data);
}
