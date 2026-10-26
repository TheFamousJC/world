// Original procedural score and cues. No streamed media, assets, keys or runtime AI.
export function audioPreferences(value={}){return {muted:value.muted!==false,music:value.music!==false,effects:value.effects!==false,volume:Number.isFinite(value.volume)?Math.max(0,Math.min(1,value.volume)):.6};}
const NOTES={route:[659.25,783.99],depart:[164.81,246.94,329.63],arrive:[493.88,659.25],collect:[659.25,783.99,987.77],warning:[440,329.63],error:[164.81,146.83],win:[329.63,392,493.88,659.25],lose:[196,164.81,155.56]};
function tone(ctx,bus,frequency,at,duration,gain,type,track){
 const oscillator=ctx.createOscillator(),envelope=ctx.createGain();oscillator.type=type;oscillator.frequency.value=frequency;
 envelope.gain.setValueAtTime(.0001,at);envelope.gain.exponentialRampToValueAtTime(gain,at+.02);envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);
 oscillator.connect(envelope);envelope.connect(bus);track?.(oscillator);
 oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();track?.(oscillator,true);};oscillator.start(at);oscillator.stop(at+duration+.02);return oscillator;
}
export function scheduleCue(ctx,bus,name,at=ctx.currentTime,track){const notes=NOTES[name];if(!notes)return;notes.forEach((n,i)=>tone(ctx,bus,n,at+i*.11,name==='win'?.42:.2,.1,'sine',track));}
export function scheduleMusicPulse(ctx,bus,step,at,beat,track){
 const bass=[82.41,0,82.41,123.47,98,0,110,123.47][step%8];if(bass)tone(ctx,bus,bass,at,.24,.06,'triangle',track);
 if(step%8===0)for(const n of (step%16===0?[164.81,196,246.94]:[146.83,196,220]))tone(ctx,bus,n,at,beat*7.8,.035,'sine',track);
}
export class GameAudio{
 constructor({load=()=>({}),save=()=>{},factory}={}){
  try{this.preferences=audioPreferences(load());}catch{this.preferences=audioPreferences();}
  this.save=save;this.factory=factory||(()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)());this.available=!!factory||!!(globalThis.AudioContext||globalThis.webkitAudioContext);this.unlocked=false;this.active=false;this.running=false;this.hidden=false;this.musicNodes=new Set();this.effectNodes=new Set();this.cueTimes=new Map();
 }
 unlock(){if(this.preferences.muted||!this.available)return;try{
  if(!this.context){const c=this.context=this.factory();this.master=c.createGain();this.musicBus=c.createGain();this.effectsBus=c.createGain();this.musicBus.gain.value=.65;this.effectsBus.gain.value=.5;this.musicBus.connect(this.master);this.effectsBus.connect(this.master);this.master.connect(c.destination);}
  this.unlocked=true;this.apply();
 }catch{this.available=false;this.unlocked=false;}}
 setPreferences(patch){this.preferences=audioPreferences({...this.preferences,...patch});try{this.save(this.preferences);}catch{}this.apply();}
 toggleMute(){this.setPreferences({muted:!this.preferences.muted});if(!this.preferences.muted)this.unlock();}
 track(set){return (node,ended=false)=>ended?set.delete(node):set.add(node);}
 stop(set){for(const n of set){try{n.stop();}catch{}}set.clear();}
 stopMusic(){clearInterval(this.timer);this.timer=null;this.stop(this.musicNodes);}
 update({running,hidden=false,runId,remaining=Infinity,deadline=1}){
  this.running=!!running;this.hidden=!!hidden;this.pressure=remaining/Math.max(1,deadline)<.2;
  if(runId!==this.runId){this.runId=runId;this.warned=false;this.stopMusic();this.stop(this.effectNodes);}
  this.apply();if(remaining<=10&&!this.warned&&this.active)this.warned=this.cue('warning');
 }
 apply(){try{return this.applyGraph();}catch{this.available=false;this.active=false;this.stopMusic();this.stop(this.effectNodes);}}
 applyGraph(){const c=this.context;if(!c)return;this.master.gain.setTargetAtTime(this.preferences.muted?0:this.preferences.volume,c.currentTime,.025);this.musicBus.gain.setTargetAtTime(this.preferences.music?.65:0,c.currentTime,.025);this.effectsBus.gain.setTargetAtTime(this.preferences.effects?.5:0,c.currentTime,.025);
  this.active=!!(this.unlocked&&this.running&&!this.hidden&&!this.preferences.muted);
  if(!this.active){this.stopMusic();if(this.preferences.muted||this.hidden||!this.forcePlaying){this.stop(this.effectNodes);c.suspend().catch(()=>{});}return;}
  c.resume().catch(()=>{});
  if(!this.preferences.effects)this.stop(this.effectNodes);
  if(!this.preferences.music){this.stopMusic();return;}
  if(!this.timer){this.next=c.currentTime+.04;this.step=0;const tick=()=>{if(!this.active)return;const beat=this.pressure?.58:.75;while(this.next<c.currentTime+.25){scheduleMusicPulse(c,this.musicBus,this.step++,this.next,beat,this.track(this.musicNodes));this.next+=beat;}};tick();this.timer=setInterval(tick,150);}
 }
 cue(name,options={}){try{return this.playCue(name,options);}catch{return false;}}
 playCue(name,{force=false}={}){if(!NOTES[name])return false;const c=this.context;if(!c||!this.unlocked||this.preferences.muted||!this.preferences.effects||this.hidden||(!this.active&&!force))return false;
  const last=this.cueTimes.get(name)??-Infinity;if(c.currentTime-last<.4)return false;this.cueTimes.set(name,c.currentTime);c.resume().catch(()=>{});scheduleCue(c,this.effectsBus,name,c.currentTime+.01,this.track(this.effectNodes));
  if(force){this.forcePlaying=true;clearTimeout(this.forceTimer);this.forceTimer=setTimeout(()=>{this.forcePlaying=false;if(!this.active){this.stop(this.effectNodes);this.context?.suspend().catch(()=>{});}},1600);}return true;
 }
 dispose(){clearTimeout(this.forceTimer);this.stopMusic();this.stop(this.effectNodes);return this.context?.close();}
}
