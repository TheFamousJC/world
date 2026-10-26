import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EXPEDITION_CASES} from '../src/expedition-cases.js';
import {analyseExpedition,EXPEDITION_METHODS} from '../src/expedition-tools.js';
const inputs=JSON.parse(fs.readFileSync(new URL('./fixtures/expedition-tool-inputs.json',import.meta.url)));
test('750 authored expedition packets have unique evidence and codes, fifteen methods per story',()=>{
 const cases=Object.values(EXPEDITION_CASES);assert.equal(cases.length,750);assert.equal(new Set(cases.map(p=>p.answer)).size,750);assert.equal(new Set(cases.map(p=>p.signature)).size,750);
 for(let n=1;n<=50;n++){const prefix='atlas-'+String(n).padStart(2,'0')+'-';const rows=cases.filter(p=>p.id.startsWith(prefix));assert.equal(rows.length,15);assert.equal(new Set(rows.map(p=>p.method)).size,15);for(const p of rows){assert(p.devices.includes(p.method));assert.equal(p.devices.length,6);assert.equal(p.hints.length,3);}}
});
test('every expedition evidence set can be solved by its advertised offline device',async()=>{for(const [id,input] of Object.entries(inputs)){const p=EXPEDITION_CASES[id];const result=await analyseExpedition(p,input.tool,input);assert(result.includes(p.answer),id+' '+p.method+' '+result);}});
test('independent analytical reference vectors and malformed input',async()=>{
 const p={};assert.match(analyseExpedition(p,'hex',{text:'43 4f 44 45 20 31 32 33 34'}),/1234/);assert.match(analyseExpedition(p,'vigenere',{text:'LXFOPVEFRNHR',key:'LEMON'}),/0TT02K0T30WN/);assert.match(analyseExpedition(p,'railfence',{text:'WECRLTEERDSOEEFEAOCAIVDEN',key:'3'}),/WEAREDISCOVEREDFLEEATONCE/);
 assert.match(analyseExpedition(p,'timelog',{text:'2026-01-01T23:30+02:00',key:'2026-01-02T00:30+01:00'}),/0120/);assert.match(analyseExpedition(p,'hex',{text:'not hex'}),/complete hexadecimal/);assert.match(analyseExpedition(p,'columnar',{text:'1234',key:'1111'}),/four-column/);assert.equal(EXPEDITION_METHODS.length,22);
});
