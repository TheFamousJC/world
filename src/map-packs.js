// A registry of independently packaged regions. New corridors can use the same
// offline loader without replacing the globe, story engine or routing code.
export const MAP_PACKS=Object.freeze([
 {id:'osaka',hub:'world-0-0',corridor:'world-0',name:'Osaka / Itami',file:'osaka.geojson'},
 {id:'tokyo',hub:'world-0-1',corridor:'world-0',name:'Tokyo / Haneda',file:'tokyo.geojson'},
{"id":"johannesburg","hub":"world-1-0","corridor":"world-1","name":"Johannesburg","file":"johannesburg.geojson"},
{"id":"cape-town","hub":"world-1-1","corridor":"world-1","name":"Cape Town","file":"cape-town.geojson"},
{"id":"los-angeles","hub":"world-2-0","corridor":"world-2","name":"Los Angeles","file":"los-angeles.geojson"},
{"id":"san-francisco","hub":"world-2-1","corridor":"world-2","name":"San Francisco","file":"san-francisco.geojson"},
{"id":"buenos-aires","hub":"world-3-0","corridor":"world-3","name":"Buenos Aires","file":"buenos-aires.geojson"},
{"id":"santiago","hub":"world-3-1","corridor":"world-3","name":"Santiago","file":"santiago.geojson"},
{"id":"sydney","hub":"world-4-0","corridor":"world-4","name":"Sydney","file":"sydney.geojson"},
{"id":"melbourne","hub":"world-4-1","corridor":"world-4","name":"Melbourne","file":"melbourne.geojson"},
{"id":"delhi","hub":"world-5-0","corridor":"world-5","name":"Delhi","file":"delhi.geojson"},
{"id":"jaipur","hub":"world-5-1","corridor":"world-5","name":"Jaipur","file":"jaipur.geojson"},
{"id":"kuala-lumpur","hub":"world-6-0","corridor":"world-6","name":"Kuala Lumpur","file":"kuala-lumpur.geojson"},
{"id":"singapore","hub":"world-6-1","corridor":"world-6","name":"Singapore","file":"singapore.geojson"},
{"id":"casablanca","hub":"world-7-0","corridor":"world-7","name":"Casablanca","file":"casablanca.geojson"},
{"id":"marrakesh","hub":"world-7-1","corridor":"world-7","name":"Marrakesh","file":"marrakesh.geojson"}
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
 // Retain only this corridor's two graphs; cached packs stay on disk. Browsing
 // every continent should not retain sixteen large road graphs in memory.
 for(const hub of network.regions.keys())if(!MAP_PACKS.some(p=>p.corridor===corridor&&p.hub===hub))network.regions.delete(hub);
 for(const [p,data] of loaded)network.installRegion(p.hub,data);
}
