import {ALPINE_DATA} from './alpine-data.js';
import {expeditionStoryDeadline} from './expedition-clock.js';
import {EXPEDITION_NARRATIVES} from './expedition-narratives.js';
import {EXPEDITION_CASES} from './expedition-cases.js';
import {withCataloguePursuit} from './catalogue-pursuit.js';
// Five operations retain the supplied five-city order. The story deadline and
// reserve are set once from physical distances and do not reset at checkpoints.
export function buildAlpineStory(base){return [ALPINE_DATA].map(r=>{
 const {title,intro,artifact,theme}=EXPEDITION_NARRATIVES[r.number-1],p=(city,n)=>r.id+'-c'+city+'-p'+n;
 const totalKm=r.roadLegs.reduce((n,l)=>n+l.km,0);
 // Ground-paced allowance plus handoffs, analysis and missed connections.
 const deadline=expeditionStoryDeadline(r.roadLegs.map((l,i)=>({km:l.km,mode:'coach',serviceMinutes:Math.ceil(l.minutes*1.22),waitMinutes:102,borderMinutes:r.cities[i].countryCode!==r.cities[i+1].countryCode?45+i*10:0}))),budget=Math.ceil((totalKm*.1+450)/10)*10;
 const chapters=r.cities.map((c,i)=>i===0?'Prepare in '+c.name:i===4?'Extraction in '+c.name:'The '+c.name+' relay');
 const operations=r.cities.map((city,stage)=>{
  const id=r.id+'-op-'+(stage+1),previous=Math.max(0,stage-1),start=stage?p(previous,1):p(0,0),goal=p(stage,stage===4?7:1);
  const contacts=stage?[p(previous,4),p(stage,2),p(stage,3)]:[p(0,2),p(0,3),p(0,4)];
  const detours=contacts.map((place,j)=>{const taskId=id+'-mission-'+(j+1),packet=EXPEDITION_CASES[taskId];return {id:taskId,place,title:['Recover','Authenticate','Release'][j]+' '+artifact+' ֲ· packet '+(stage*3+j+1),minutes:3+stage+j,reward:0,energy:0,items:[taskId+' decoded'],requires:j?[id+'-mission-'+j]:[],trace:true,cipher:{revision:2,caseId:taskId,number:j+1,method:packet.method}};});
  const bonuses=[{id:id+'-cash',place:p(stage,5),title:'Collect the contingency reserve',kind:'cash',minutes:12+stage,reward:45+stage*10,energy:0},{id:id+'-energy',place:p(stage,6),title:'Food, water and recovery',kind:'energy',minutes:18+stage,reward:0,energy:50}];
  return {...base,minIntermediateKm:.02,id,storyId:r.id,campaign:r.id,number:stage+1,stage,stageCount:5,start,goal,deadline,budget,energy:100,allDetours:true,codeMissions:true,expedition:true,global:true,detailed:true,mapRevision:1,corridor:r.id,region:r.region,modes:['walk','cycle','taxi','bus','coach','train','flight'],closedModes:[],crossingDelay:35+stage*10,travelFactor:1,effortFactor:1+stage*.06,detours,bonuses,title:chapters[stage],subtitle:title+' ֲ· Operation '+(stage+1)+' / 5',difficulty:['First contact','Border watch','A narrowing window','Under observation','Final extraction'][stage],story:intro+' '+(stage?'Continue from '+r.cities[previous].name+' to '+city.name+'. ':'Prepare before leaving '+city.name+'. ')+'Collect and decode three packets in sequence, then reach '+(stage===4?'the final extraction point.':'the departure interchange. ')+'The shared deadline, money, energy and pursuit carry through all five operations.',hint:'Decode the current amber packet to reveal the next contact. Intercity coaches leave from interchanges; flights require the two real airfields, and trains need their marked stations. Optional cash and recovery contacts are separate.'};
 });
 const pursued=withCataloguePursuit(operations).map(c=>Object.freeze({...c,pursuitRules:{...c.pursuitRules,response:65-c.stage*7,search:18,grace:12},pursuitHideKeys:[...c.pursuitHideKeys,...operations.map(op=>op.id+':'+p(op.stage,7))],hides:[...c.hides,{place:p(c.stage,7),title:'Safe address',minutes:20,cash:3,energy:20}]}));
 return Object.freeze({...r,title,intro,theme,themeLabel:'Civilian evidence thriller',accent:['#75e7c8','#e8bd68','#8dbbff','#d99dec','#f3947c'][Math.floor((r.number-1)/10)],level:1+Math.floor((r.number-1)%10/2),tagline:'Protect the '+artifact+'. Reach extraction.',chapters,items:operations.flatMap(c=>c.detours.map(t=>t.title)),ending:'The '+artifact+' reaches the receiving team in '+r.cities[4].name+'. Five cities, fifteen verified packets: the original evidence is secured.',global:true,detailed:true,expedition:true,routeLabel:r.cities.map(c=>c.name).join(' ג†’ '),deadline,totalKm,operations:pursued});
})[0];}
