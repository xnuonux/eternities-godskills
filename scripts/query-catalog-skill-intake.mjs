import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {searchCatalogIntake} from '../src/catalog-skill-classification.mjs';
import {loadCatalogWithContinuations} from '../src/catalog-continuation.mjs';
const options={};
for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i];assert(['--query','--domain','--limit'].includes(key)&&process.argv[i+1]!==undefined,'Use --query TEXT [--domain DOMAIN] [--limit 1..5]');
  options[key.slice(2)]=key==='--limit'?Number(process.argv[++i]):process.argv[++i];
}
const {sources,queue,classificationComplete,continuation,bodyStatuses}=await loadCatalogWithContinuations(fileURLToPath(new URL('../',import.meta.url)));
console.log(JSON.stringify({scope:'catalog801 cold source metadata; advisory domains are incomplete',networkCalls:0,classificationComplete,continuation,bodyStatuses,results:searchCatalogIntake(sources,queue,options)},null,2));
