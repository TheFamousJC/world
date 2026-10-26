// Development harness only. Production requires the player's analysis and submission.
import {completeDetour,cipherAction} from './engine.js';
import {cipherCase} from './ciphers.js';
export function completeDecodedDetour(state,c,id,custom={},network=null){
 const collected=completeDetour(state,c,id,custom,network),t=c.detours?.find(t=>t.id===id);
 return collected.ok&&t?.cipher&&collected.state.phase!=='lost'?cipherAction(collected.state,c,id,'solve',cipherCase(t).answer,custom):collected;
}
