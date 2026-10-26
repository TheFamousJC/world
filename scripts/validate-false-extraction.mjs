import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {FALSE_EXTRACTION_STORY as story,ALPINE_STORY} from '../src/scenarios.js';
import {EVIDENCE_CASES,evidenceAction} from '../src/evidence.js';
import {safePursuitAction} from '../src/pursuit-validation.js';
import {expeditionNetwork,simulateExpedition} from './validate-expeditions.mjs';
export function runFalseExtraction(strategy='fast'){
 const n=expeditionNetwork(ALPINE_STORY),boards=[];
 const run=simulateExpedition(story,n,strategy,true,(state,c,network)=>{const spec=EVIDENCE_CASES[c.stage];state=safePursuitAction(state,c,8);boards.push({id:c.id,state:structuredClone(state)});const r=evidenceAction(state,c,'verify',{choice:spec.answer,evidence:spec.proof},network);if(!r.ok)throw Error(r.message);state=r.state;const steps=[{type:'deduction',choice:spec.answer,evidence:spec.proof}];if(c.stage===2){const d=evidenceAction(state,c,'decoy',{target:c.decoyPlace},network);if(!d.ok)throw Error(d.message);state=d.state;steps.push({type:'decoy'});}return {state,steps};});
 n.regions.clear();return {...run,boards};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const results=['fast','frugal'].map(runFalseExtraction);fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/false-extraction-runs.json',JSON.stringify(results));for(const r of results)console.log('PASS',r.strategy,r.state.phase,r.state.elapsed,r.state.cash,r.state.evidence.decoys.length);}
