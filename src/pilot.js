// Authored, deterministic fiction for The Shelter Keys. No live feeds or AI.
export const PILOT_STORY='escape-12';
const rows=[
 ['Shelter access','Volunteer relay','The shelter shuttle is running normally.','Dispatch confirms roadworks: motor journeys take 18 extra minutes during the first 90 minutes.',18,90,['Building','Access code'],[['F-17','F-71','F-12'],['KEY-42','KEY-24','KEY-47']],[0,0],'Caretaker message: use building F-17. The sealed key tag reads KEY-42.'],
 ['Airport connection','Old station notice','Airport shuttles leave every 20 minutes.','The airport shuttle is suspended for the first 120 minutes of this operation. Taxi and walking remain possible.',0,120,['Departure airport','Terminal side'],[['Haneda HND','Itami ITM','Narita NRT'],['Airside gate','Cargo depot','Landside terminal']],[1,2],'Caretaker contact sheet: depart from Itami ITM, landside terminal.'],
 ['Flight handoff','Passenger rumour','There is always another flight within the hour.','Flights depart at operation +180, +300, +420 and +540 minutes. Boarding and checks must finish before departure.',0,0,['Arrival airport','Manifest reference'],[['Narita NRT','Haneda HND','Itami ITM'],['SK-318','SK-381','SK-813']],[1,0],'Building inspection card: receiving flight arrives at Haneda HND. Coordinator reference: SK-318.'],
 ['Receiving shelter','Forwarded voice message','The receiving roads have cleared.','An inspection cordon adds 25 minutes to motor journeys during the first 150 minutes. Footpaths stay open.',25,150,['Receiving building','Register edition'],[['G-04','G-40','G-14'],['Edition B','Edition A','Edition C']],[0,2],'Bedding voucher: deliver to G-04. The occupancy-register cover is marked Edition C.'],
 ['Final handover','Unconfirmed handover note','The manager will accept any copy of the key receipt.','The manager requires the original seal and the named receiving desk. Shuttles stop after operation +240 minutes.',0,240,['Key seal','Receiving desk'],[['RED-8','BLUE-8','RED-3'],['Desk South','Desk North','Desk East']],[0,1],'Main entrance key: seal RED-8. Manager confirmation: bring the original to Desk North.']
];
export function pilotConfig(id,stage){if(id!==PILOT_STORY)return null;const [title,source,claim,truth,delay,until,labels,choices,answers,evidence]=rows[stage];return {title,source,claim,truth,delay,until,document:{title:title+' clearance',evidence,fields:labels.map((label,i)=>({id:'field'+i,label,choices:choices[i],answer:choices[i][answers[i]]}))}};}
export function pilotState(elapsed=0,id=PILOT_STORY+'-op-1'){return {version:1,starts:{[id]:elapsed},reports:{},documents:{}};}
export const operationStart=(state,c)=>state.pilot?.starts[c.id]??state.elapsed;
export const verifiedReport=(state,c)=>state.pilot?.reports[c.id];
export const documentCleared=(state,c)=>!!c.pilot&&c.pilot.document.fields.every(f=>state.pilot?.documents[c.id]?.[f.id]===f.answer);
export function reportView(state,c){const stamp=verifiedReport(state,c),start=operationStart(state,c);return stamp?{source:stamp.source||'Dispatch confirmation',at:stamp.at,age:Math.floor(state.elapsed-stamp.at),confidence:state.elapsed-stamp.at>=45?'Aging confirmation':'Confirmed at check',text:c.pilot.truth}:{source:c.pilot.source,at:start-20,age:Math.floor(state.elapsed-start+20),confidence:'Unverified · may be wrong',text:c.pilot.claim};}
export function observeReport(state,c){if(!c.pilot)return state;const next=structuredClone(state);next.pilot.reports[c.id]={at:state.elapsed,source:'Departure check'};return next;}
export function timetable(c,mode,elapsed,start){
 if(!c.pilot||!['bus','flight'].includes(mode))return null;
 const first=mode==='flight'?180:20,interval=mode==='flight'?120:30,last=mode==='flight'?540:c.stage===4?240:720,boarding=mode==='flight'?45+c.crossingDelay:12;
 const departure=start+first+Math.max(0,Math.ceil((elapsed+boarding-start-first-1e-9)/interval))*interval,lastDeparture=start+first+Math.floor((Math.min(start+last,c.deadline)-start-first)/interval)*interval;
 return {departure,boarding,wait:Math.max(0,departure-elapsed-boarding),available:departure<=lastDeparture,first:start+first,last:lastDeparture,interval};
}
export function pilotCost(state,c,mode,to,actual=false){
 if(!c.pilot||!state)return {extra:0};
 const known=actual||!!verifiedReport(state,c),start=operationStart(state,c),local=state.elapsed-start,schedule=timetable(c,mode,state.elapsed,start);
 if(schedule&&!schedule.available)return {extra:0,error:'The last '+(mode==='flight'?'flight':'shuttle')+' has departed for this operation. '+(mode==='flight'?'Restart this story to try an earlier connection.':'Choose another transport.')};
 if(known&&c.stage===1&&mode==='bus'&&to===c.goal&&local<120)return {extra:0,error:'Dispatch confirms the airport shuttle is suspended until operation +120 minutes. Wait for reopening or choose Taxi or Walk. No fare was charged.'};
 const delay=known&&['bus','taxi'].includes(mode)&&local<c.pilot.until?c.pilot.delay:0;
 return {extra:(schedule?.wait||0)+delay,schedule,...(actual&&!verifiedReport(state,c)&&delay?{notice:'Departure check: the earlier report was outdated. Road conditions add '+delay+' minutes to this motor journey.'}:{})};
}
export function pilotAction(state,c,kind,answers={}){
 const reject=message=>({ok:false,state,message});
 if(!c.pilot||!['planning','arrived'].includes(state.phase))return reject('Finish travelling before using the field desk.');
 if(kind==='verify'&&verifiedReport(state,c)&&state.elapsed-verifiedReport(state,c).at<45)return reject('Dispatch was checked recently. Its timestamp shows when you checked.');
 if(kind==='document'&&documentCleared(state,c))return reject('This clearance is already checked.');
 if(!['verify','document','wait'].includes(kind))return reject('Unknown field-desk action.');
 if(kind==='document'&&!(c.stage===2?c.detours.slice(0,1):c.detours).every(t=>state.completedTasks.includes(t.id)))return reject(c.stage===2?'Collect mission 1 at the airport to obtain the reference evidence.':'Collect both mission items to obtain the reference evidence for this document.');
 const correct=kind==='document'&&c.pilot.document.fields.every(f=>answers[f.id]===f.answer),minutes=kind==='wait'?15:kind==='verify'?5:correct?3:4,cash=kind==='verify'?2:0;
 if(state.cash<cash)return reject('Dispatch verification costs £2.');
 if(state.elapsed+minutes>=c.deadline)return reject('Not enough time remains for this check.');
 const next=structuredClone(state);next.pilot||=pilotState(state.elapsed,c.id);next.elapsed+=minutes;next.cash-=cash;
 if(kind==='verify')next.pilot.reports[c.id]={at:next.elapsed};
 if(correct)next.pilot.documents[c.id]=Object.fromEntries(c.pilot.document.fields.map(f=>[f.id,answers[f.id]]));
 const message=kind==='wait'?'Waited 15 game minutes. Timetables and report ages have advanced; no money spent.':kind==='verify'?'Dispatch confirmed. '+c.pilot.truth:correct?'Clearance checked against the evidence. 3 minutes spent.':'The document does not match the collected evidence. Review both fields and try again. 4 minutes spent; clearance was not issued.';
 next.history.unshift({type:kind==='verify'?'verified intelligence':'document check',message,at:next.elapsed});next.history=next.history.slice(0,50);
 return {ok:kind==='wait'||kind==='verify'||correct,state:next,message};
}
export function validPilot(state,scenarios){
 const p=state.pilot;if(!p||p.version!==1||!p.starts||!p.reports||!p.documents||[p.starts,p.reports,p.documents].some(x=>typeof x!=='object'||Array.isArray(x)))return false;
 const current=scenarios.find(c=>c.id===state.scenarioId),allowed=scenarios.filter(c=>c.storyId===PILOT_STORY&&c.stage<=current.stage);
 for(const [id,at] of Object.entries(p.starts))if(!allowed.some(c=>c.id===id)||!Number.isFinite(at)||at<0||at>state.elapsed)return false;
 if(!Number.isFinite(p.starts[state.scenarioId]))return false;
 for(const [id,r] of Object.entries(p.reports))if(!allowed.some(c=>c.id===id)||!Number.isFinite(r?.at)||r.at<(p.starts[id]??Infinity)||r.at>state.elapsed)return false;
 for(const [id,answers] of Object.entries(p.documents)){const c=allowed.find(c=>c.id===id);if(!c||!answers||Object.keys(answers).length!==c.pilot.document.fields.length||!c.pilot.document.fields.every(f=>answers[f.id]===f.answer))return false;}
 return true;
}
