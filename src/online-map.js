// Pending offline-label glyph requests keep using the bundled font during a style switch.
export function mapResourceURL(url){return url.startsWith('https://tiles.openfreemap.org/fonts/sans-serif/')?new URL('../fonts/Open Sans Semibold/'+url.split('/').at(-1),import.meta.url).href:url;}
export const ONLINE_STYLE='https://tiles.openfreemap.org/styles/dark';
export const ONLINE_ATTRIBUTION='<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
export function onlineGroup(id){return /^railway/.test(id)?'rail':/^boundary/.test(id)?'borders':/^building/.test(id)?'buildings':/^(highway|road_)/.test(id)?'roads':null;}
export function prepareOnlineStyle(style){
 if(style.version!==8||!Array.isArray(style.layers)||!style.sources)throw Error('Unsupported online map style');
 const used=new Set(style.layers.map(l=>l.source).filter(Boolean));
 const sources=Object.fromEntries([...used].map(id=>['ofm-'+id,{...structuredClone(style.sources[id]),attribution:ONLINE_ATTRIBUTION}]));
 const layers=style.layers.map(original=>{
  const l=structuredClone(original);l.id='ofm-'+original.id;if(l.source)l.source='ofm-'+l.source;
  l.paint={...l.paint};
  if(l.type==='background')l.paint['background-color']='#091922';
  if(original.id==='water')l.paint['fill-color']='#0b3045';
  if(original.id==='landuse_residential')l.paint['fill-color']='#152831';
  if(original.id==='landcover_wood')l.paint['fill-color']='#163b32';
  if(original.id==='landuse_park')l.paint['fill-color']='#1a4035';
  if(original.id==='building'){l.paint['fill-color']='#304854';l.paint['fill-outline-color']='#415c68';}
  if(l.type==='line'&&/^highway_.*_inner$/.test(original.id))l.paint['line-color']=original.id.includes('motorway')?'#b3a47d':'#82978f';
  if(l.type==='line'&&/^highway_.*_casing$/.test(original.id))l.paint['line-color']='#233d4a';
  if(l.type==='line'&&/^highway_(minor|path)$/.test(original.id))l.paint['line-color']='#627d89';
  if(l.type==='line'&&/railway/.test(original.id))l.paint['line-color']='#a69bc6';
  if(l.type==='line'&&/^boundary/.test(original.id))l.paint['line-color']='#b29568';
  if(l.type==='symbol'&&l.layout?.['text-field']){l.paint['text-color']='#c7dce5';l.paint['text-halo-color']='#10222d';l.paint['text-halo-width']=1.3;}
  return l;
 });
 return {sources,layers,glyphs:style.glyphs,sprite:style.sprite};
}
// Add only a basemap. Never replace the style containing game routes and sources.
export class OnlineBasemap{
 constructor(map){this.map=map;this.ids=[];this.groups=new Map();this.originalGlyphs=map.getStyle().glyphs||null;this.originalSprite=map.getStyle().sprite||null;this.baseFonts=map.getStyle().layers.filter(l=>l.type==='symbol'&&l.layout?.['text-font']).map(l=>({id:l.id,font:l.layout['text-font']}));}
 async load(signal){
  if(this.ids.length)return;
  const r=await fetch(ONLINE_STYLE,{signal});if(!r.ok)throw Error('Online style unavailable');
  const prepared=prepareOnlineStyle(await r.json());if(signal.aborted)throw Error('Cancelled');
  const m=this.map;this.glyphs=prepared.glyphs;this.sprite=prepared.sprite;
  try{
   this.applyFonts();
   for(const [id,source] of Object.entries(prepared.sources))if(!m.getSource(id))m.addSource(id,source);
   for(const layer of prepared.layers){m.addLayer({...layer,layout:{...layer.layout,visibility:'none'}},'parks');this.ids.push(layer.id);this.groups.set(layer.id,{group:onlineGroup(layer.id.slice(4)),visibility:layer.layout?.visibility||'visible'});}
  }catch(e){for(const id of this.ids)if(m.getLayer(id))m.removeLayer(id);for(const id of Object.keys(prepared.sources))if(m.getSource(id))m.removeSource(id);this.ids=[];this.restoreFonts();throw e;}
 }
 applyFonts(){for(const {id} of this.baseFonts)this.map.setLayoutProperty(id,'text-font',['Noto Sans Regular']);if(this.glyphs)this.map.setGlyphs(this.glyphs);if(this.sprite)this.map.setSprite(this.sprite);}
 restoreFonts(){this.map.setGlyphs(this.originalGlyphs);this.map.setSprite(this.originalSprite);for(const {id,font} of this.baseFonts)this.map.setLayoutProperty(id,'text-font',font);}
 show(visible,options){
  const m=this.map;
  if(visible)this.applyFonts();
  for(const id of this.ids){const {group,visibility}=this.groups.get(id);m.setLayoutProperty(id,'visibility',visible&&(!group||options[group]!==false)?visibility:'none');}
  if(!visible)this.restoreFonts();
 }
}
