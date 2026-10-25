import {travelRoute,shuttleCost,courierExpired,validCourierSave} from './transport.js';
import {pilotState,pilotCost,documentCleared,validPilot,observeReport} from './pilot.js';
import {walkingRestPlan} from './journey.js';
import {distance,lineLength,segmentsIntersect} from './geo.js';
import {MODES} from './network.js';
import {placeById,PLACES} from './scenarios.js';
export const SAVE_VERSION=1;
// Physical/service availability is separate from the player's current resources.
// A long walk remains an option; departure still checks energy and the deadline.
export function transportOptions(scenario,network,from,to){
 if(!from||!to||from.id===to.id)return [];
 return scenario.modes.filter(mode=>{
  if(scenario.closedModes.includes(mode)||to.id===scenario.goal&&scenario.goalModes&&!scenario.goalModes.includes(mode))return false;
  if(mode==='train'&&(from.kind!=='station'||to.kind!=='station'))return false;
  if(mode==='bus'&&(from.kind==='waypoint'||to.kind==='waypoint'))return false;
  const route=travelRoute(scenario,network,from,to,mode);if(!route)return false;
  return !route.crossing||(scenario.border!=='all-closed'&&(scenario.border!=='road-closed'||mode==='train'));
 });
}
export function hasIntermediateStop(state,scenario,custom={}){const start=placeById(scenario.start),goal=placeById(scenario.goal);return (scenario.campaign?(state.stageVisited||[scenario.start]):state.visited).some(id=>{const p=custom[id]||placeById(id);return p&&id!==scenario.start&&id!==scenario.goal&&distance(start.coordinates,p.coordinates)>=(scenario.minIntermediateKm||.25)&&distance(goal.coordinates,p.coordinates)>=(scenario.minIntermediateKm||.25);});}
export function journeyCost(route,mode,scenario,elapsed=0,initialEnergy=100,context={}){
 const rules=MODES[mode],access=mode==='walk'?0:route.access||0,ride=Math.max(0,route.km-access),service=shuttleCost(scenario,route,elapsed,context.state),wait=service?service.wait:mode==='train'?20-elapsed%20:rules.wait;
 const energy=Math.max(1,Math.ceil((rules.energy*ride+MODES.walk.energy*access)*(scenario.effortFactor||1))),recovery=mode==='walk'?walkingRestPlan(energy,initialEnergy):{rests:[],restMinutes:0,energyAfter:initialEnergy-energy};
 const field=pilotCost(context.state,scenario,mode,context.to,context.actual);
 return {...field,...(service||{}),minutes:Math.ceil((ride/rules.speed*60+access/MODES.walk.speed*60)*(scenario.travelFactor||1)+wait+(route.crossing?scenario.crossingDelay:0))+recovery.restMinutes+(field.extra||0)+(service?.inspectionDelay||0),cash:service?.cash??Math.ceil(rules.base+rules.perKm*ride),energy,energyStart:initialEnergy,...recovery,waitMinutes:wait+(field.schedule?.wait||0),borderDelay:route.crossing?scenario.crossingDelay:0};
}
const copy=s=>structuredClone(s);
export function newGame(scenario,runId='run'){return {version:SAVE_VERSION,...(scenario.pilot?{pilot:pilotState(0,scenario.id)}:{}),mapRevision:scenario.mapRevision||1,scenarioId:scenario.id,runId,position:scenario.start,cash:scenario.budget,energy:scenario.energy,elapsed:0,phase:'planning',pending:null,sequence:0,papers:false,inventory:[],completedTasks:[],stageVisited:[scenario.start],visited:[scenario.start],intel:[],history:[],departures:0};}
function record(s,type,message){s.history.unshift({type,message,at:s.elapsed});s.history=s.history.slice(0,50);}
export function remaining(s,scenario){return Math.max(0,scenario.deadline-s.elapsed);}
export function quoteJourney(state,scenario,network,to,mode,custom={}){
 const fail=(code,message)=>({ok:false,code,message});if(state.phase!=='planning')return fail('phase','Review your arrival before starting another leg.');if(to===state.position)return fail('same-place','You are already here. Choose a different destination.');if(!scenario.modes.includes(mode)||!MODES[mode])return fail('mode','This transport is not available in this challenge.');if(scenario.closedModes.includes(mode))return fail('service','This service is cancelled in the scenario. Choose another transport.');const from=custom[state.position]||placeById(state.position),destination=custom[to]||placeById(to);if(!from||!destination)return fail('place','Choose a mapped destination.');if(mode==='train'&&(from.kind!=='station'||destination.kind!=='station'))return fail('station','Trains can only be boarded between railway stations.');if(mode==='bus'&&(from.kind==='waypoint'||destination.kind==='waypoint'))return fail('stop','The shuttle serves marked game stops, not arbitrary road points.');if(mode==='bus'&&scenario.shuttle&&(!scenario.shuttle.stops.includes(from.id)||!scenario.shuttle.stops.includes(to)))return fail('stop','This shuttle only serves Brest Central, Brest North and Northern pickup. Walk or take a taxi to or from the contact.');const route=travelRoute(scenario,network,from,destination,mode);if(!route)return fail('network','No connected route for this transport exists in the loaded map. Try a different stop or mode.');if(route.km<.025)return fail('same-place','This point is too close to your current position to create a leg.');const cost=journeyCost(route,mode,scenario,state.elapsed,state.energy,{state,actual:true,to}),{minutes,cash,energy}=cost;if(cost.error)return fail('timetable',cost.error);if(to===scenario.goal&&scenario.goalModes&&!scenario.goalModes.includes(mode))return fail('approach','The final approach must be on foot. Choose Walk.');
 if(route.crossing){if(scenario.requireItems?.some(item=>!state.inventory?.includes(item)))return fail('inventory','Collect your '+scenario.requireItems.join(' and ')+' from the marked mission stop before crossing. Generic travel papers cannot replace this pickup.');if(scenario.border==='all-closed'||(scenario.border==='road-closed'&&mode!=='train'))return fail('border','This crossing is closed to your transport in this scenario. A road on the map is not permission to pass.');if(scenario.requirePapers&&!state.papers)return fail('papers','A scenario travel clearance is required. Arrange papers through Ask HQ.');if(scenario.closeAt!==null&&state.elapsed+minutes>scenario.closeAt){const left=Math.max(0,Math.ceil(scenario.closeAt-state.elapsed)),late=Math.ceil(state.elapsed+minutes-scenario.closeAt);return fail('window',left?`The crossing closes in ${left} game minutes. This leg takes ${minutes} minutes, so it would finish ${late} minutes too late. Choose a faster journey or a shorter route.`:`The crossing is already closed. It does not reopen in this scenario. Restart the challenge to try a different plan.`);}}
 const counter=scenario.detours?.find(t=>t.place===to&&t.closesAt!==undefined&&!state.completedTasks.includes(t.id));if(counter&&state.elapsed+minutes+counter.minutes>counter.closesAt)return fail('window','This leg cannot finish the '+counter.minutes+'-minute handoff before the counter closes at T+'+counter.closesAt+'. Choose a faster option or restart if the window has passed.');if(to===scenario.goal&&scenario.goalItems?.some(item=>!state.inventory.includes(item)))return fail('inventory','Deposit the documents and retain the deposit receipt before the final handoff.');if(to===scenario.goal&&scenario.detours&&!detoursComplete(state,scenario))return fail('detour','Complete the required missions before reaching this checkpoint. Visit the amber mission markers and collect the items in order.');
 if(to===scenario.goal&&scenario.milestones.some(id=>!state.visited.includes(id)))return fail('objective','Visit the marked traveller and supplies stops before the final pickup.');if(to===scenario.goal&&!hasIntermediateStop(state,scenario,custom))return fail('intermediate','No direct journey in this challenge. Reach an intermediate stop at least 250 m from both the start and goal, then continue.');if(scenario.pilot&&(to===scenario.goal||mode==='flight')&&!documentCleared(state,scenario))return fail('document','Check this operation’s clearance at the Field desk before this handoff. Collect the reference mission items, compare their evidence with both document fields, then submit.');if(cash>state.cash)return fail('money',`This leg costs £${cash}; you have £${state.cash}. Change transport or shorten the plan.`);if(mode!=='walk'&&energy>state.energy)return fail('energy','You do not have enough energy. Rest or choose less strenuous transport.');if(state.elapsed+minutes>scenario.deadline)return fail('deadline','This leg would miss your final deadline. Find a faster route.');return {ok:true,...(scenario.pilot||scenario.shuttle?{quotedAt:state.elapsed}:{}),from:state.position,to,mode,route,...cost,borderAt:route.crossing?(mode==='flight'?0:crossingProgress(route.coordinates,network.borders)):null,km:route.km};
}
export function depart(state,quote){if(state.phase!=='planning'||!quote.ok||quote.from!==state.position||quote.quotedAt!==undefined&&Math.abs(quote.quotedAt-state.elapsed)>.000001)return {ok:false,state,message:'Departure unavailable.'};const s=quote.notice?observeReport(state,{id:state.scenarioId,pilot:true}):copy(state);if(quote.notice)record(s,'conditions',quote.notice);s.sequence++;s.pending={id:s.runId+':'+s.sequence,...quote};s.phase='travelling';record(s,'departure','Departing for '+quote.to+'.');return {ok:true,state:s};}
export function arrive(state,scenario){if(state.phase!=='travelling'||!state.pending)return state;const s=copy(state),q=s.pending;s.cash-=q.cash;s.energy=q.energyAfter??s.energy-q.energy;s.elapsed+=q.minutes;s.position=q.to;if(!s.visited.includes(q.to))s.visited.push(q.to);s.stageVisited||=[scenario.start];if(!s.stageVisited.includes(q.to))s.stageVisited.push(q.to);s.departures++;s.pending=null;s.phase=q.to===scenario.goal&&scenario.milestones.every(id=>s.visited.includes(id))?(scenario.campaign&&scenario.stage<(scenario.stageCount||5)-1?'checkpoint':'won'):'arrived';if(q.restMinutes)record(s,'recovery',q.rests.length+' mandatory recovery stop(s), '+q.restMinutes+' minutes included.');if(q.borderDelay)record(s,q.mode==='flight'?'airport checks':'border',(q.mode==='flight'?'Airport checks: ':'Border control: ')+q.borderDelay+' minutes included.');if(courierExpired(s,scenario)){s.phase='lost';record(s,'deadline','The deposit counter can no longer accept the six-minute handoff. Restart the courier pilot.');}if(q.inspectionDelay)record(s,'inspection','Shuttle document inspection: '+q.inspectionDelay+' minutes included.');record(s,'arrival',`Arrived at ${q.to}. £${q.cash} and ${q.minutes} min spent.`);return s;}
export function reviewArrival(state){if(state.phase!=='arrived')return state;const s=copy(state);s.phase='planning';return s;}
export function advanceClock(state,scenario,minutes=1){if(!['planning','arrived','checkpoint'].includes(state.phase))return state;const s=copy(state);s.elapsed=Math.min(scenario.deadline,s.elapsed+Math.max(0,minutes));if(s.elapsed>=scenario.deadline||courierExpired(s,scenario)){s.phase='lost';record(s,'deadline',courierExpired(s,scenario)?'The six-minute deposit can no longer finish before T+75.':'The pickup deadline has passed.');}return s;}
export function advanceStage(state,current,next){
 if(state.phase!=='checkpoint'||!current.campaign||next?.campaign!==current.campaign||next.stage!==current.stage+1||state.position!==next.start)return state;
 const s=copy(state);s.scenarioId=next.id;if(next.pilot){s.pilot||=pilotState(s.elapsed,next.id);s.pilot.starts[next.id]=s.elapsed;}s.stageVisited=[s.position];s.phase='planning';record(s,'checkpoint','Section '+(next.stage+1)+' begins. Cash and time carried forward.');return s;
}
export function completeDetour(state,scenario,id,custom={}){
 const t=scenario.detours?.find(t=>t.id===id),reject=message=>({ok:false,state,message});
 if(!t||!['planning','arrived'].includes(state.phase))return reject('Reach a detour location before completing its task.');
 if((state.completedTasks||[]).includes(id)||!scenario.allDetours&&scenario.detours.some(t=>(state.completedTasks||[]).includes(t.id)))return reject('This section’s detour is already complete.');
 if(t.requires?.some(id=>!state.completedTasks?.includes(id)))return reject('Complete the preceding mission first.');
 const p=custom[state.position]||placeById(state.position),target=placeById(t.place);
 if(!p||distance(p.coordinates,target.coordinates)>.15)return reject('Travel to '+target.name+' to complete this task.');
 if(t.requiredItems?.some(item=>!state.inventory.includes(item)))return reject('Bring the sealed courier documents before attempting this deposit.');if(t.closesAt!==undefined&&state.elapsed+t.minutes>t.closesAt)return reject('The deposit counter cannot complete the handoff before T+'+t.closesAt+'. Documents have not been removed.');if(state.elapsed+t.minutes>=scenario.deadline)return reject('Not enough operation time remains.');
 const s=copy(state);s.completedTasks||=[];s.completedTasks.push(id);s.inventory||=[];if(t.consumeItems)s.inventory=s.inventory.filter(item=>!t.consumeItems.includes(item));for(const item of t.items||[])if(!s.inventory.includes(item))s.inventory.push(item);s.elapsed+=t.minutes;s.cash+=t.reward;s.energy=Math.min(100,s.energy+t.energy);record(s,'detour',t.title);return {ok:true,state:s,message:t.title+' complete. '+t.minutes+' minutes spent.'};
}
export function action(state,scenario,kind){const reject=message=>({ok:false,state,message});if(!['planning','arrived'].includes(state.phase))return reject('Finish travelling before another action.');let cash=0,minutes=0,energy=0;const id=(scenario.storyId?scenario.id+':':'')+state.position+':'+kind,noticeId=scenario.storyId?scenario.id+':notice':'notice';if(kind==='rest'){if(state.energy>=100)return reject('Your energy is already full.');cash=6;minutes=20;energy=45;}else if(kind==='prepare'){if(state.papers)return reject('Your travel clearance is already arranged.');cash=4;minutes=15;}else if(kind==='notice'){if(state.intel.includes(noticeId))return reject('The official scenario notice is already in your notebook.');minutes=10;}else if(kind==='local'){if(state.intel.includes(id))return reject('HQ has already briefed you on this location.');cash=2;minutes=5;}else return reject('Unknown action.');if(state.cash<cash)return reject('Not enough cash for this action.');if(state.elapsed+minutes>=scenario.deadline)return reject('Not enough time remains for this action.');const s=copy(state);s.cash-=cash;s.elapsed+=minutes;s.energy=Math.min(100,s.energy+energy);if(kind==='prepare')s.papers=true;else if(kind==='notice')s.intel.push(noticeId);else if(kind==='local')s.intel.push(id);const messages={rest:'Food and rest restored energy.',prepare:'Scenario travel clearance arranged.',notice:'Crossing and transport restrictions recorded.',local:scenario.hint};record(s,kind,messages[kind]);return {ok:true,state:s,message:messages[kind]};}
export function makeSave(session){return JSON.stringify({version:SAVE_VERSION,savedAt:new Date().toISOString(),...session});}
export function readSave(raw,scenarios){try{
 const s=JSON.parse(raw),scenario=scenarios.find(c=>c.id===s?.game?.scenarioId);
 if(s?.version!==SAVE_VERSION||!scenario||!['planning','travelling','arrived','checkpoint','won','lost'].includes(s.game.phase)||!Number.isFinite(s.game.cash)||!Number.isFinite(s.game.energy)||!Number.isFinite(s.game.elapsed)||s.game.cash<0||s.game.energy<0||s.game.energy>100||s.game.elapsed<0||s.game.elapsed>scenario.deadline||!Array.isArray(s.game.visited)||!Array.isArray(s.game.intel)||!Array.isArray(s.game.history)||!Array.isArray(s.plan)||!s.custom||typeof s.custom!=='object'||Array.isArray(s.custom))return null;
 const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=85;
 for(const [id,p] of Object.entries(s.custom))if(!/^waypoint-\d+$/.test(id)||p.id!==id||p.kind!=='waypoint'||!validPoint(p.coordinates)||typeof p.name!=='string')return null;
 const known=new Set([...PLACES.map(p=>p.id),...Object.keys(s.custom)]);
 if(!known.has(s.game.position)||s.plan.length>20||s.plan.some(l=>!known.has(l.to)||!scenario.modes.includes(l.mode)))return null;
 if(s.game.phase==='travelling'){const p=s.game.pending;if(!p?.ok||!known.has(p.to)||p.from!==s.game.position||!scenario.modes.includes(p.mode)||![p.cash,p.energy,p.minutes].every(Number.isFinite)||p.cash<0||p.cash>s.game.cash||p.energy<0||(p.energyAfter===undefined&&p.energy>s.game.energy)||p.minutes<=0||s.game.elapsed+p.minutes>scenario.deadline||!Array.isArray(p.route?.coordinates)||p.route.coordinates.length<2||!p.route.coordinates.every(validPoint))return null;}
 else if(s.game.pending)return null;
 if(s.travelRemaining!==undefined&&(!Number.isInteger(s.travelRemaining)||s.travelRemaining<0||s.travelRemaining>20||s.travelRemaining>s.plan.length))return null;
 if(s.draft&&(!known.has(s.draft.from)||(s.draft.to!==null&&!known.has(s.draft.to))||s.draft.from!==(s.plan.at(-1)?.to||s.game.position)))return null;
 s.game.inventory||=[];if(!Array.isArray(s.game.inventory)||s.game.inventory.some(x=>typeof x!=='string'))return null;s.game.completedTasks||=[];s.game.stageVisited||=[scenario.start];
 const validTasks=new Set(scenarios.flatMap(c=>[...(c.detours||[]),...(c.bonuses||[])].map(t=>t.id)));
 if(!Array.isArray(s.game.completedTasks)||s.game.completedTasks.some(id=>!validTasks.has(id))||!Array.isArray(s.game.stageVisited)||s.game.stageVisited.some(id=>!known.has(id)))return null;
 if(s.game.phase==='won'&&scenario.campaign&&scenario.stage<(scenario.stageCount||5)-1)s.game.phase='checkpoint';
 if(s.game.phase==='checkpoint'&&(!scenario.campaign||scenario.stage>=(scenario.stageCount||5)-1||s.game.position!==scenario.goal))return null;
 if(s.game.pending?.energyAfter!==undefined){
 const p=s.game.pending;if(!Number.isFinite(p.energyAfter)||p.energyAfter<0||p.energyAfter>100||p.energyStart!==s.game.energy)return null;
 if(p.mode!=='walk'&&p.energyAfter!==s.game.energy-p.energy)return null;
 if(p.mode==='walk'){const expected=walkingRestPlan(p.energy,s.game.energy);if(JSON.stringify(p.rests)!==JSON.stringify(expected.rests)||p.restMinutes!==expected.restMinutes||p.energyAfter!==expected.energyAfter)return null;}
 }
 if(scenario.detailed&&s.game.mapRevision!==scenario.mapRevision){
  // Old schematic quotes cannot be settled on the new physical road network.
  // No pending fare was charged. Keep all completed actions and resources.
  s.game.mapRevision=scenario.mapRevision;s.mapUpgrade=true;s.clockRunning=false;
  if(s.game.phase==='travelling'){s.game.phase='planning';s.game.pending=null;}
  if(!placeById(s.game.position)){
   const old=s.custom[s.game.position],candidates=PLACES.filter(p=>p.hub===old?.hub&&p.mapPack);
   candidates.sort((a,b)=>distance(old.coordinates,a.coordinates)-distance(old.coordinates,b.coordinates));
   if(candidates.length)s.game.position=candidates[0].id;
  }
  s.plan=[];s.draft=null;s.travelRemaining=0;s.rejection=null;
  record(s.game,'map update','Regional maps upgraded to real OSM roads and airport landside locations. Resources and items kept; old untravelled plans cleared.');
 }
 if(scenario.pilot&&!s.game.pilot){s.game.pilot=pilotState(s.game.elapsed,scenario.id);s.clockRunning=false;s.pilotUpgrade=true;if(s.game.phase==='travelling'){s.game.phase='planning';s.game.pending=null;}s.plan=[];s.draft=null;s.travelRemaining=0;}
 if(scenario.pilot&&!validPilot(s.game,scenarios))return null;if(!validCourierSave(s.game,scenario))return null;
 return s;
 }catch{return null;}}

export function detoursComplete(state,scenario){const check=t=>(state.completedTasks||[]).includes(t.id);return !scenario.detours||(scenario.allDetours?scenario.detours.every(check):scenario.detours.some(check));}
export function collectBonus(state,scenario,id,custom={}){
 const t=scenario.bonuses?.find(t=>t.id===id),reject=message=>({ok:false,state,message});
 if(!t||!['planning','arrived'].includes(state.phase))return reject('Finish travelling before collecting supplies.');
 if(state.completedTasks.includes(id))return reject('This pickup has already been collected.');
 if(t.kind==='energy'&&state.energy>=100)return reject('Energy is already full. Save this stop for later.');
 const p=custom[state.position]||placeById(state.position),target=placeById(t.place);
 if(!p||distance(p.coordinates,target.coordinates)>.15)return reject('Travel to '+target.name+' first.');
 if(state.elapsed+t.minutes>=scenario.deadline)return reject('Not enough time remains for this pickup.');
 const s=copy(state);s.completedTasks.push(id);s.cash+=t.reward;s.energy=Math.min(100,s.energy+t.energy);s.elapsed+=t.minutes;
 record(s,'optional pickup',t.title);return {ok:true,state:s,message:t.title+' collected. '+t.minutes+' minutes spent.'};
}
function crossingProgress(coords,borders=[]){const total=lineLength(coords);let used=0;for(let i=1;i<coords.length;i++){const d=distance(coords[i-1],coords[i]);for(const f of borders)for(let j=1;j<f.geometry.coordinates.length;j++)if(segmentsIntersect(coords[i-1],coords[i],f.geometry.coordinates[j-1],f.geometry.coordinates[j]))return Math.min(1,(used+d/2)/total);used+=d;}return .5;}
