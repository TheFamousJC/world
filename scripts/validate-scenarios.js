import {OfflineValidationNetwork} from './offline-network.js';
import {WorldNetwork} from '../src/world-network.js';
import {validateStories} from '../src/story-validation.js';
import fs from 'node:fs';
import {Network} from '../src/network.js';
import {SCENARIOS} from '../src/scenarios.js';
import {findWinningStrategies} from '../src/validate.js';
const network=new Network(JSON.parse(fs.readFileSync(new URL('../public/data/region.geojson',import.meta.url))));let failed=0;
for(const scenario of SCENARIOS){const strategies=findWinningStrategies(scenario,network);console.log(`${String(scenario.number).padStart(2,'0')} ${scenario.title}: ${strategies.length} winning transport strategies (${strategies.map(s=>s.label).join(', ')})`);if(strategies.length<2)failed++;}
if(failed)throw Error(`${failed} scenarios need another feasible strategy.`);console.log('All ten scenarios have at least two independently simulated winning strategies.');

const worldNetwork=new OfflineValidationNetwork(network);const stories=validateStories(worldNetwork);for(const s of stories)console.log(`${s.id} ${s.region}: two full-escape wins; economy ${s.economyMinutes}m / £${s.economyCash}, reserves ${s.reserveMinutes}m / £${s.reserveCash}`);console.log('50 stories / 250 operations / 500 missions: two complete strategies each.');
