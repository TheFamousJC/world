export const REST_THRESHOLD=20,REST_RECOVERY=40,REST_MINUTES=25;

// One deterministic schedule powers quotes, animation and final accounting.
export function walkingRestPlan(effort,initialEnergy){
 let energy=initialEnergy,used=0;const rests=[];
 const rest=()=>{const after=Math.min(100,energy+REST_RECOVERY);rests.push({at:effort?used/effort:0,minutes:REST_MINUTES,energyBefore:energy,energyAfter:after});energy=after;};
 if(effort>0&&energy<=REST_THRESHOLD)rest();
 while(used<effort){const consume=Math.min(effort-used,energy-REST_THRESHOLD);used+=consume;energy-=consume;if(energy<=REST_THRESHOLD)rest();}
 return {rests,restMinutes:rests.length*REST_MINUTES,energyAfter:energy};
}

export function journeyFrame(q,fraction,initialEnergy=q.energyStart??100){
 const target=Math.max(0,Math.min(1,fraction))*q.minutes,wait=q.waitMinutes||0;
 const events=[...(q.rests||[]).map(r=>({...r,type:'rest'})),...(q.checkpointDelay?[{at:.45,minutes:q.checkpointDelay,type:'checkpoint'}]:[]),...(q.inspectionDelay?[{at:.15,minutes:q.inspectionDelay,type:'inspection'}]:[]),...(q.borderDelay?[{at:q.mode==='flight'?0:q.borderAt??.5,minutes:q.borderDelay,type:'border'}]:[])].sort((a,b)=>a.at-b.at);
 const moving=Math.max(.001,q.minutes-wait-events.reduce((n,e)=>n+e.minutes,0));
 let elapsed=wait,at=0,recovered=0;
 const result=(progress,stage,extra=0)=>({progress,stage,energy:Math.max(0,Math.min(100,initialEnergy-(q.energy||0)*progress+recovered+extra))});
 if(target<wait)return result(0,q.mode==='flight'?'CHECK-IN / BOARDING':'WAITING TO DEPART');
 for(const e of events){const motion=(e.at-at)*moving;if(target<elapsed+motion)return result(at+(target-elapsed)/moving,'EN ROUTE');elapsed+=motion;
  if(target<elapsed+e.minutes){const f=(target-elapsed)/e.minutes;return result(e.at,e.type==='rest'?'MANDATORY REST · '+Math.ceil(e.minutes*(1-f))+' MIN LEFT':(e.type==='checkpoint'?'POLICE CHECKPOINT · ':e.type==='inspection'?'DOCUMENT INSPECTION · ':q.mode==='flight'?'AIRPORT CHECKS · ':'BORDER CONTROL · ')+Math.ceil(e.minutes*(1-f))+' MIN LEFT',e.type==='rest'?(e.energyAfter-e.energyBefore)*f:0);}
  elapsed+=e.minutes;if(e.type==='rest')recovered+=e.energyAfter-e.energyBefore;at=e.at;
 }
 return result(Math.min(1,at+(target-elapsed)/moving),fraction>=1?'ARRIVED':'EN ROUTE');
}
