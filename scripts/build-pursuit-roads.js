// Rebuild authored pursuit corridors from the licensed, bundled OSM graph.
import fs from 'node:fs';import {Network} from '../src/network.js';import {placeById} from '../src/places.js';
const n=new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url)))),ids=['north','central','workshop','aid','pickup'],paths={};
for(const a of ids)for(const b of ids)if(a!==b){const r=n.route(placeById(a),placeById(b),'taxi');if(!r)throw Error('Disconnected pursuit corridor: '+a+' → '+b);paths[a+':'+b]={km:r.km,coordinates:r.coordinates};}
fs.writeFileSync(new URL('../src/pursuit-roads.js',import.meta.url),'// Authored pursuit corridors on the bundled OpenStreetMap road graph. ODbL; see public/CREDITS.txt.\nexport const PURSUIT_ROADS='+JSON.stringify(paths)+';\n');
console.log('Rebuilt 20 offline pursuit road corridors.');
