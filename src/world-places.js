import {REGION_PLACES} from './region-places.js';
import {JAPAN_PLACES} from './japan-places.js';
// Approximate reference hubs outside Japan. Japan overrides below use attributed
// OSM road nodes and actual landside airport positions. Contacts remain fiction.
// No claim is made about real services, streets, borders or current conditions.
export const CORRIDORS=[
 ['Japan','Osaka',[135.50,34.69],'Tokyo',[139.69,35.68]],
 ['Southern Africa','Johannesburg',[28.04,-26.20],'Cape Town',[18.42,-33.92]],
 ['North America','Los Angeles',[-118.24,34.05],'San Francisco',[-122.42,37.77]],
 ['South America','Buenos Aires',[-58.38,-34.60],'Santiago',[-70.67,-33.45]],
 ['Oceania','Sydney',[151.21,-33.87],'Melbourne',[144.96,-37.81]],
 ['South Asia','Delhi',[77.21,28.61],'Jaipur',[75.79,26.91]],
 ['Southeast Asia','Kuala Lumpur',[101.69,3.14],'Singapore',[103.82,1.35]],
 ['North Africa','Casablanca',[-7.59,33.57],'Marrakesh',[-7.98,31.63]]
].map((a,i)=>({id:'world-'+i,region:a[0],cities:[{name:a[1],coordinates:a[2]},{name:a[3],coordinates:a[4]}]}));
const offsets=[[0,0],[.018,.014],[-.018,.024],[.028,-.012],[-.025,-.018],[.008,.038],[-.037,.008],[.038,.025],[-.01,-.038]];
const labels=['reception','records contact','dispatch desk','shelter','supply exchange','air terminal','cash contact','rest garden','final pickup'];
export const WORLD_PLACES=CORRIDORS.flatMap(c=>c.cities.flatMap((city,h)=>labels.map((label,j)=>{
 const id=`${c.id}-${h}-${j}`,anchor=JAPAN_PLACES[id]||REGION_PLACES[id];
 return {id,name:city.name+' · '+label,kind:j===5?'airport':j===7?'shelter':'supply',hub:`${c.id}-${h}`,corridor:c.id,fictional:true,...anchor,note:j===5?'Actual airport landside location on the offline OSM road network. Flight schedules and prices are game fiction.':'Fictional mission contact anchored to a mapped public road. Not a real shelter or service.'};
})));
