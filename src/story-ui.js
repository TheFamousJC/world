import {STORIES,storyById,placeById} from './scenarios.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function storyArt(s){
 const wet=['flood','storm','winter'].includes(s.theme),hot=s.theme==='wildfire';
 return `<svg class="story-art" viewBox="0 0 900 260" role="img" aria-label="Illustrated ${esc(s.themeLabel)} mission dossier" style="--story-accent:${s.accent}"><defs><radialGradient id="glow-${s.id}"><stop stop-color="${s.accent}" stop-opacity=".23"/><stop offset="1" stop-color="#081722"/></radialGradient><pattern id="grid-${s.id}" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${s.accent}" stroke-opacity=".13"/></pattern></defs><rect width="900" height="260" fill="url(#glow-${s.id})"/><rect width="900" height="260" fill="url(#grid-${s.id})"/><g fill="none" stroke="${s.accent}" opacity=".5"><circle cx="660" cy="130" r="110"/><ellipse cx="660" cy="130" rx="52" ry="110"/><ellipse cx="660" cy="130" rx="110" ry="42"/><path d="M550 130H770M660 20V240"/></g><path d="M60 196L210 135L350 167L500 72L660 130" fill="none" stroke="${s.accent}" stroke-width="3" stroke-dasharray="8 7"/>${[ [60,196],[210,135],[350,167],[500,72],[660,130]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="8" fill="#091923" stroke="${s.accent}" stroke-width="3"/><text x="${x+15}" y="${y-15}" fill="${s.accent}" font-size="13" font-family="monospace">0${i+1}</text>`).join('')}<g fill="${s.accent}" opacity=".4">${Array.from({length:wet?45:12},(_,i)=>wet?`<path d="M${(i*67+s.number*19)%900} ${(i*43)%240}l-7 17" stroke="${s.accent}"/>`:`<rect x="${(i*71)%870}" y="${200-(i*17)%75}" width="18" height="${60+(i*17)%75}" opacity="${hot?.6:.2}"/>`).join('')}</g><text x="30" y="35" fill="${s.accent}" font-size="12" font-family="monospace">DOSSIER ${String(s.number).padStart(2,'0')} / ${esc(s.themeLabel.toUpperCase())}</text><text x="30" y="244" fill="#c1d7df" font-size="11" font-family="monospace">24:00:00 / FIVE OPERATIONS / ONE WAY THROUGH</text></svg>`;
}
const tutorial=[
  [
    "Your escape starts here.",
    "Choose from 50 illustrated stories. Each has five increasingly demanding operations, two required missions per operation and one shared 24-hour deadline. Read the dossier before launching. Stories includes local border escapes and worldwide journeys with flights."
  ],
  [
    "Explore the map.",
    "Your red marker shows where you really are. Zoom into offline OpenStreetMap roads, crossings, railways and airport terminals. Click a named place or your own point on the map. A point needs a connected route: water and isolated locations may be unreachable."
  ],
  [
    "Choose how to travel.",
    "Each destination opens the available transport choices, with fare, journey time and estimated energy. Walking, cycling, taxis, shuttles, trains and flights appear only where supported. Walking follows connected paths; it cannot cross every obstacle. Ground routes follow the mapped network."
  ],
  [
    "Build a route, then Go.",
    "Add stops one at a time and choose transport for each leg. Click a planned stop again to delete that section and every following leg. Select the next leg, part of the route or the whole plan, then press Go. Your marker moves only when you travel."
  ],
  [
    "Watch both clocks.",
    "Planning uses one game second per real second. Go animates travel while adding its simulated journey time. Time to reach safety covers the whole story; Border closes in is a separate crossing limit. Border checks and queues add delay. Reach the crossing before its window ends."
  ],
  [
    "Complete both missions.",
    "Visit mission 1, press Collect, then do mission 2. Travelling to a contact does not collect the item automatically. Your journey stops at an unfinished mission so you can act. Both items are required before the operation destination. On phones, mission actions stay near Go at the top."
  ],
  [
    "Protect cash and energy.",
    "Fares spend your shared cash reserve; the £ symbol means game credits everywhere. Walking drains energy and low energy triggers a mandatory 25-minute recovery rest, included in the quote. Optional cash and energy stops can be collected once per operation. Paid rest costs £6 and 20 minutes."
  ],
  [
    "Make the flight connection.",
    "Worldwide stories use real airport terminal locations. Finish the city pickups before reaching the departure airport. Operation 3 begins with an airport handoff, then a flight and onward ground travel. An arbitrary map point cannot become an airport. Boarding and control delays count against your deadline."
  ],
  [
    "Ask for local knowledge.",
    "Local knowledge can reveal clues and alternatives, but enquiries cost game time and may cost money. Go checks each leg against the actual game rules. An impossible leg takes no fare; already completed travel still costs time and money. Stop after this leg lets you rethink the remaining plan."
  ],
  [
    "Try the field-desk pilot.",
    "The Shelter Keys adds uncertain intelligence, scheduled shuttles and flights, and document puzzles across all five operations. Check report sources and ages; verification costs £2 and 5 minutes. Departures use T+ time since the story began. Collect the evidence, match both document fields and earn a fresh clearance for each operation."
  ],
  [
    "Keep the escape moving.",
    "Reach the operation destination, then press Continue. Cash, energy, collected items and elapsed time carry into the next operation; they do not reset. Complete operation 5 for the ending and choose your next story. Pause freezes planning and blocks actions; an underway journey still settles its quoted time and fare."
  ],
  [
    "Play anywhere.",
    "On phones, Go, deadlines, cash, energy and missions stay visible while scrolling. Progress saves in this browser on this device. Open a story online once to download its city packs for offline play. Optional archived satellite imagery needs internet. Use Settings for reduced motion, Help and FAQ for detail, or replay this guide with ?. All events, schedules and border rules are game fiction."
  ]
];
export function installStoryUI({readStory,startStory,chooseLegacy,pause,readTutorial,writeTutorial}){
 let selected=STORIES[0],step=0;
 const $=id=>document.getElementById(id),close=()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 function library(){close();$('story-library').showModal();cards();}
 function cards(){const q=$('story-search').value.toLowerCase(),filter=$('story-region').value;const list=STORIES.filter(s=>(!filter||(filter==='world'?s.global:!s.global))&&[s.title,s.tagline,s.region,s.routeLabel].join(' ').toLowerCase().includes(q));$('story-count').textContent=list.length+' of 50 stories · 250 operations · 500 missions';$('story-grid').innerHTML=list.map(s=>{const saved=readStory(s.id);return `<button class="story-card" data-story="${s.id}" style="--story-accent:${s.accent}">${storyArt(s)}<span class="eyebrow">${s.id==='escape-12'?'FIELD-DESK PILOT · ':''}${esc(s.region)} / ${s.detailed?'OSM ROADS + FLIGHTS':s.global?'FLIGHTS + GROUND':'DETAILED ROAD PACK'}</span><h3>${esc(s.title)}</h3><p>${esc(s.tagline)}</p><small>${esc(s.routeLabel)}<br>24 hours · 5 operations · Pressure ${s.level}/5</small><strong>${saved?.game.phase==='won'?'✓ Completed':saved?'Resume operation '+Number(saved.game.scenarioId.split('-op-')[1])+'/5':'Open briefing →'}</strong></button>`;}).join('');}
 function briefing(id){selected=storyById(id);close();const s=selected,saved=readStory(s.id);$('story-splash').style.setProperty('--story-accent',s.accent);$('story-splash-content').innerHTML=storyArt(s)+`<div class="splash-copy"><span class="eyebrow">STORY ${s.number} / ${esc(s.region)} / PRESSURE ${s.level}</span><h1>${esc(s.title)}</h1><h2>${esc(s.tagline)}</h2><p>${esc(s.intro)}</p><p class="brief-stats">24 HOURS SHARED · 5 OPERATIONS · 10 REQUIRED MISSIONS<br>Starting reserve £${s.operations[0].budget} · 100% energy</p>${s.id==='escape-12'?'<p class="pilot-brief"><b>NEW FIELD-DESK PILOT</b><br>Five operations with uncertain reports, timed shuttles and flights, and a two-field document check at every handoff. Open Field desk or Local knowledge to verify reports and inspect paperwork. Unverified estimates can miss delays; Go rechecks actual conditions. All times are T+ since this 24-hour story began.</p>':''}<p class="map-resolution">${s.detailed?'Detailed expedition: offline OpenStreetMap roads, buildings and railways. Ground travel follows the road network; flights connect the two real airports. Contacts and service schedules are game fiction.':s.global?'World expedition: offline schematic city links and fictional flights. Ground routes do not represent real streets.':'Detailed expedition: offline OpenStreetMap road and rail routing in the Brest–Biała corridor.'}</p><ol class="chapter-list">${s.operations.map(c=>`<li><strong>${esc(c.title)}</strong><span>${esc(placeById(c.start).name)} → ${esc(placeById(c.goal).name)}</span><small>${c.detours.map(t=>esc(t.title)).join(' → ')}<br>${esc(c.difficulty)} · journey pressure +${Math.round((c.travelFactor-1)*100)}%</small></li>`).join('')}</ol></div>`;$('launch-story').textContent=saved&&saved.game.phase!=='won'?'Resume saved escape →':'Start 24-hour escape →';$('reset-story').hidden=!saved||saved.game.phase==='won';$('story-splash').showModal();}
 function wizard(){step=0;close();drawWizard();$('tutorial-dialog').showModal();}
 function drawWizard(){const [title,text]=tutorial[step];$('tutorial-step').textContent='FIELD GUIDE / '+(step+1)+' OF '+tutorial.length;$('tutorial-title').textContent=title;$('tutorial-text').textContent=text;$('tutorial-progress').innerHTML=tutorial.map((_,i)=>`<i class="${i<=step?'active':''}"></i>`).join('');$('tutorial-next').textContent=step===tutorial.length-1?'Choose a story →':'Next →';$('tutorial-back').hidden=step===0;}
 $('story-search').addEventListener('input',cards);$('story-region').addEventListener('change',cards);
 document.body.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.story)briefing(b.dataset.story);if(b.id==='launch-story'){close();const saved=readStory(selected.id);startStory(selected,saved?.game.phase==='won'?null:saved);}if(b.id==='reset-story'){close();startStory(selected,null);}if(b.id==='story-back')library();if(b.id==='legacy-story'){close();chooseLegacy();}if(b.id==='tutorial-button')wizard();if(b.id==='tutorial-back'){step--;drawWizard();}if(b.id==='tutorial-next'){if(step<tutorial.length-1){step++;drawWizard();}else{writeTutorial();library();}}if(b.id==='tutorial-skip'){writeTutorial();library();}});
 $('tutorial-dialog').addEventListener('cancel',e=>{e.preventDefault();writeTutorial();library();});
 return {library,briefing,wizard,firstVisit:()=>!readTutorial()};
}
