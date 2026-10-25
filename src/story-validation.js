import {safePursuitLeg,safePursuitAction} from './pursuit-validation.js';
import {pilotAction,documentCleared} from './pilot.js';
import {STORIES,ALL_SCENARIOS,placeById,PLACES} from './scenarios.js';
import {newGame,quoteJourney,depart,arrive,reviewArrival,completeDetour,collectBonus,advanceStage,makeSave,readSave} from './engine.js';
export function simulateStory(story,network,mode='bus',optional=false){
 let state=newGame(story.operations[0],story.id+'-'+mode),legs=[];
 const fail=message=>{throw Error(story.id+' '+state.scenarioId+' '+state.position+': '+message);};
 function travel(c,to){
  state=reviewArrival(state);const a=placeById(state.position),b=placeById(to);
  if(a.hub&&b.hub&&a.hub!==b.hub){
   const departure=PLACES.find(p=>p.hub===a.hub&&p.kind==='airport'),arrival=PLACES.find(p=>p.hub===b.hub&&p.kind==='airport');
   if(state.position!==departure.id)travel(c,departure.id);
   leg(c,arrival.id,'flight');if(state.position===to)return;
  }
  if(state.position!==to)leg(c,to,c.closedModes.includes(mode)?'taxi':mode);
 }
 function leg(c,to,m){state=reviewArrival(state);if(c.pilot&&(to===c.goal||m==='flight')&&!documentCleared(state,c)){state=safePursuitAction(state,c,3);const result=pilotAction(state,c,'document',Object.fromEntries(c.pilot.document.fields.map(f=>[f.id,f.answer])));if(!result.ok)fail(result.message);state=result.state;}const safe=safePursuitLeg(state,c,network,to,m);state=safe.state;m=safe.mode;let q=safe.quote;if(!q.ok&&q.code==='timetable'&&m==='bus'){m='taxi';q=quoteJourney(state,c,network,to,m);}if(!q.ok)fail(m+' → '+to+' '+q.code+' '+q.message);state=arrive(depart(state,q).state,c);legs.push({to,mode:m});}
 for(const c of story.operations){if(c.pilot){state=safePursuitAction(state,c,5);const r=pilotAction(state,c,'verify');if(!r.ok)fail(r.message);state=r.state;}
  for(const task of c.detours){travel(c,task.place);state=safePursuitAction(state,c,task.minutes);const r=completeDetour(state,c,task.id,{},network);if(!r.ok)fail(r.message);state=r.state;
   if(optional)for(const bonus of c.bonuses){if(state.completedTasks.includes(bonus.id)||placeById(bonus.place).hub!==placeById(state.position).hub)continue;travel(c,bonus.place);const r=collectBonus(state,c,bonus.id);if(r.ok)state=r.state;else if(bonus.kind!=='energy'||state.energy<100)fail(r.message);}
  }
  travel(c,c.goal);
  const saved=readSave(makeSave({game:state,plan:[],custom:{},clockRunning:false}),ALL_SCENARIOS);if(!saved)fail('Save rejected');state=saved.game;
  if(c.stage<4){if(state.phase!=='checkpoint')fail('Missing checkpoint');state=advanceStage(state,c,story.operations[c.stage+1]);}
 }
 if(state.phase!=='won')fail('Not won');return {state,legs};
}
export function validateStories(network){
 if(STORIES.length!==50)throw Error('Exactly 50 stories required');
 return STORIES.map(s=>{const economy=simulateStory(s,network,'bus'),reserve=simulateStory(s,network,'taxi',true);return {id:s.id,title:s.title,region:s.region,economyMinutes:economy.state.elapsed,reserveMinutes:reserve.state.elapsed,economyCash:economy.state.cash,reserveCash:reserve.state.cash};});
}
