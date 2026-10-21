// Validation-only lazy reader: exercise every region without holding all road
// graphs in memory at once. Production uses the asynchronous cached loader.
import fs from 'node:fs';
import {WorldNetwork} from '../src/world-network.js';
import {mapPackFor} from '../src/map-packs.js';
export class OfflineValidationNetwork extends WorldNetwork{
 route(from,to,...args){
  if(from?.hub&&from.hub===to?.hub&&!this.regions.has(from.hub)){
   const pack=mapPackFor(from.hub);
   if(pack){if([...this.regions.keys()].some(hub=>mapPackFor(hub)?.corridor!==pack.corridor))this.regions.clear();this.installRegion(pack.hub,JSON.parse(fs.readFileSync(new URL('../public/data/'+pack.file,import.meta.url))));}
  }
  return super.route(from,to,...args);
 }
}
