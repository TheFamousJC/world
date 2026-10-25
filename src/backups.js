import {makeSave,readSave} from './engine.js';
import {ALL_SCENARIOS,storyById} from './scenarios.js';
export const BACKUP_LIMIT=8*1024*1024;
export function pausedSnapshot(session){
 const snapshot=readSave(makeSave(session),ALL_SCENARIOS);
 if(!snapshot||typeof snapshot.game.runId!=='string'||!snapshot.game.runId||!Number.isInteger(snapshot.game.sequence)||snapshot.game.sequence<0||!Number.isInteger(snapshot.game.departures)||snapshot.game.departures<0||snapshot.game.phase==='travelling'&&(!snapshot.plan[0]||snapshot.plan[0].to!==snapshot.game.pending.to||snapshot.plan[0].mode!==snapshot.game.pending.mode||!(snapshot.travelRemaining>0)))throw Error('This run could not be validated. Your current game has not been changed.');
 const g=snapshot.game;
 if(g.intel.some(x=>typeof x!=='string')||g.visited.some(x=>typeof x!=='string')||g.history.some(h=>!h||typeof h.type!=='string'||typeof h.message!=='string'||!Number.isFinite(h.at)||h.at<0||h.at>g.elapsed))throw Error('This backup contains invalid journey records. Your game has not been changed.');
 if(g.pending){const p=g.pending;if(![p.km,p.route.km,p.waitMinutes,p.borderDelay].every(x=>Number.isFinite(x)&&x>=0)||p.notice!==undefined&&typeof p.notice!=='string'||p.schedule&&(!Number.isFinite(p.schedule.departure)||!Number.isFinite(p.schedule.wait)))throw Error('This backup contains an invalid travel quote. Your game has not been changed.');}
 snapshot.clockRunning=false;delete snapshot.unstarted;
 return snapshot;
}
export function exportBackup(session){return JSON.stringify({format:'escape-atlas-backup',version:1,exportedAt:new Date().toISOString(),session:pausedSnapshot(session)},null,2);}
export function importBackup(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>BACKUP_LIMIT)throw Error('Choose an Escape Atlas backup smaller than 8 MB.');
 let data;try{data=JSON.parse(raw);}catch{throw Error('This file is not readable JSON. Choose a downloaded Escape Atlas backup.');}
 if(data?.format!=='escape-atlas-backup'||data.version!==1)throw Error('This backup format is not supported. Your game has not been changed.');
 return pausedSnapshot(data.session);
}
export function describeBackup(session){
 const c=ALL_SCENARIOS.find(c=>c.id===session.game.scenarioId),s=session.game;
 return {title:c.storyId?storyById(c.storyId).title:c.title,operation:c.campaign?'Operation '+(c.stage+1)+' of '+c.stageCount:'Practice challenge',place:s.position,minutes:Math.max(0,Math.floor(c.deadline-s.elapsed)),cash:s.cash,energy:s.energy,items:[...s.inventory],pending:s.phase==='travelling'};
}
export function storeRecovery(storage,key,session){
 try{storage.setItem(key,exportBackup(session));return true;}catch{return false;}
}
