// Pure timing rules for the forthcoming five-city catalogue. Minutes are game
// time; animation duration is presentation only and must never set travel cost.
export const EXPEDITION_SPEED_KMH=Object.freeze({walk:4.5,cycle:14,taxi:45,coach:55,train:85,flight:650,boat:28,ferry:32,horse:9,camel:6,cart:7,tuktuk:20});
export function expeditionTravelMinutes({km,mode,accessKm=0,waitMinutes=0,borderMinutes=0,transferMinutes=0,serviceMinutes}){
 for(const n of [km,accessKm,waitMinutes,borderMinutes,transferMinutes])if(!Number.isFinite(n)||n<0)throw new RangeError('Distances and delays must be finite and non-negative.');
 const speed=EXPEDITION_SPEED_KMH[mode];if(!speed||accessKm>km)throw new RangeError('Use a supported mode and access distance within the leg.');
 if(serviceMinutes!==undefined&&(!Number.isFinite(serviceMinutes)||serviceMinutes<0))throw new RangeError('Invalid mapped service duration.');
 const moving=(serviceMinutes??((km-accessKm)/speed*60))+accessKm/EXPEDITION_SPEED_KMH.walk*60;
 return Math.ceil(moving+waitMinutes+borderMinutes+transferMinutes);
}
export function expeditionStoryDeadline(legs,{missionMinutes=90,analysisMinutes=180,recoveryMinutes=180,planningMinutes=60,contingency=.4}={}){
 if(!Array.isArray(legs)||legs.length!==4)throw new RangeError('A five-city story requires four verified onward legs.');
 for(const n of [missionMinutes,analysisMinutes,recoveryMinutes,planningMinutes,contingency])if(!Number.isFinite(n)||n<0)throw new RangeError('Invalid timing allowance.');
 const travel=legs.reduce((sum,leg)=>sum+expeditionTravelMinutes(leg),0),required=travel+missionMinutes+analysisMinutes+recoveryMinutes+planningMinutes;
 return Math.ceil(required*(1+contingency)/60)*60;
}
export function simulatedTravelElapsed(start,legMinutes,progress){
 if(!Number.isFinite(start)||start<0||!Number.isFinite(legMinutes)||legMinutes<0||!Number.isFinite(progress))throw new RangeError('Invalid simulation progress.');
 return start+legMinutes*Math.max(0,Math.min(1,progress));
}
