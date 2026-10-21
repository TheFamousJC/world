import {WORLD_PLACES} from './world-places.js';
export const PLACES=Object.freeze([...WORLD_PLACES,
{"id":"neple","name":"Neple signal post","coordinates":[23.5450303,52.1166732],"kind":"supply","fictional":true,"note":"Fictional story contact anchored to a mapped public road."},
{"id":"horbow","name":"Horbów courier stop","coordinates":[23.3015206,52.0392259],"kind":"supply","fictional":true,"note":"Fictional story contact anchored to a mapped public road."},
{"id":"west-cache","name":"Western orchard shelter","coordinates":[23.2062314,52.0234608],"kind":"supply","fictional":true,"note":"Fictional story contact anchored to a mapped public road."},
{"id":"townhub","name":"Krzna exchange","coordinates":[23.2543591,52.0199173],"kind":"supply","fictional":true,"note":"Fictional story contact anchored to a mapped public road."},
{"id":"railhideout","name":"Freight-yard contact","coordinates":[23.4816125,52.0266229],"kind":"supply","fictional":true,"note":"Fictional story contact anchored to a mapped public road."},
{"id":"meadow","name":"Meadow rest point","coordinates":[23.4251001,52.0456124],"kind":"supply","fictional":true,"note":"Fictional story contact anchored to a mapped public road."},
  {id:'biala',name:'Biała Podlaska evacuation point',coordinates:[23.139,52.026],kind:'pickup',fictional:true,note:'Fictional final evacuation point near Biała Podlaska. Not a real service.'},
  {id:'koroszczyn',name:'Koroszczyn contact',coordinates:[23.535,52.097],kind:'pickup',fictional:true,note:'Fictional mission contact in the Koroszczyn area.'},
  {id:'kobylany',name:'Kobylany rendezvous',coordinates:[23.548,52.0415],kind:'pickup',fictional:true,note:'Fictional rendezvous in the Kobylany area.'},
  {id:'malaszewicze',name:'Małaszewicze handoff',coordinates:[23.526,52.024],kind:'pickup',fictional:true,note:'Fictional mission handoff in the Małaszewicze area.'},
  {id:'zalesie',name:'Zalesie safe house',coordinates:[23.367,52.038],kind:'shelter',fictional:true,note:'Fictional final safe house in the Zalesie area.'},
  {id:'dobryn',name:'Dobryń supply contact',coordinates:[23.444,52.048],kind:'supply',fictional:true,note:'Fictional game contact.'},
  {id:'chotylow',name:'Chotyłów relay',coordinates:[23.415,52.023],kind:'supply',fictional:true,note:'Fictional game relay.'},
  {id:'central',name:'Brest Central',coordinates:[23.6804112,52.1004334],kind:'station',note:'Mapped railway station. Services are fictional game services.'},
  {id:'polski',name:'Brest-Paleski',coordinates:[23.7102435,52.094649],kind:'station',note:'Mapped railway station.'},
  {id:'north',name:'Brest North',coordinates:[23.6540929,52.1113978],kind:'station',note:'Mapped railway station.'},
  {id:'terespol',name:'Terespol station',coordinates:[23.601254,52.0743321],kind:'station',note:'Mapped railway station. This game does not report current services.'},
  {id:'east-gate',name:'Brest terminal',coordinates:[23.6595,52.0734],kind:'crossing',note:'Mapped crossing area. Access conditions belong to the scenario.'},
  {id:'west-gate',name:'Terespol terminal',coordinates:[23.64354,52.07054],kind:'crossing',note:'Mapped crossing area. Access conditions belong to the scenario.'},
  {id:'aid',name:'Riverside aid point',coordinates:[23.6688,52.0878],kind:'shelter',fictional:true,note:'Fictional game location anchored to the mapped road network.'},
  {id:'workshop',name:'Cycle workshop',coordinates:[23.698,52.103],kind:'supply',fictional:true,note:'Fictional game location; not a real business listing.'},
  {id:'lodge',name:'Riverside lodge',coordinates:[23.615,52.0805],kind:'shelter',fictional:true,note:'Fictional game location.'},
  {id:'pickup',name:'Northern pickup',coordinates:[23.677,52.127],kind:'pickup',fictional:true,note:'Fictional pickup point.'}
]);

export const placeById=id=>PLACES.find(p=>p.id===id);
