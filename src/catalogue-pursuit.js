// Catalogue pursuit is authored game fiction. Training challenges stay separate.
export function withCataloguePursuit(operations){
 const base=operations[0].goal,keys=operations.flatMap(c=>[c.start,...c.detours.map(t=>t.place),...(c.bonuses||[]).map(t=>t.place)].map(id=>c.id+':'+id));
 return Object.freeze(operations.map(c=>Object.freeze({...c,cataloguePursuit:true,pursuit:true,pursuitBase:base,pursuitHideKeys:keys,pursuitRules:{response:40-c.stage*4,search:12,grace:8,radius:.15},hides:[...new Set([c.start,...c.detours.map(t=>t.place),...(c.bonuses||[]).map(t=>t.place)])].map(place=>({place,title:'Trusted shelter',minutes:12,cash:0,energy:10})),detours:c.detours.map(t=>({...t,trace:true}))})));
}
