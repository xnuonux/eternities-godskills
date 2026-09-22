import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('normal domain search includes saved continuation judgments without granting authority',()=>{
  const result=JSON.parse(execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/query-catalog-skill-intake.mjs',import.meta.url)), '--query','devtools-vue','--domain','engineering'],{encoding:'utf8'}));
  assert(result.results.some(x=>x.name==='devtools-vue'),'The saved Vue judgment must be searchable');
  assert.equal(result.networkCalls,0);
  assert.equal(result.classificationComplete,false);
  assert.equal(result.continuation.providerReceipts,742);
  assert.equal(result.continuation.inputStatuses['jev-provisional'],2844);
  assert.equal(result.continuation.inputStatuses['jev-abstained'],1965);
  assert.equal(result.continuation.inputStatuses['jev-unavailable'],1096);
  assert.equal(result.continuation.retryProviderReceipts,134);
  assert(result.results.every(x=>x.activation==='none'&&x.authority==='none'));
});

test('second continuation makes its saved knowledge judgment searchable',()=>{
  const result=JSON.parse(execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/query-catalog-skill-intake.mjs',import.meta.url)), '--query','qmd','--domain','knowledge'],{encoding:'utf8'}));
  assert(result.results.some(x=>x.name==='qmd'&&x.advisoryDomain==='knowledge'));
  assert(result.results.every(x=>x.activation==='none'&&x.authority==='none'));
  assert.equal(result.networkCalls,0);assert.equal(result.classificationComplete,false);
});
