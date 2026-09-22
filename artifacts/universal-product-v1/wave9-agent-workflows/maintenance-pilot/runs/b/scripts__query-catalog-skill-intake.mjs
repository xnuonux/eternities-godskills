import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {searchCatalogIntake} from '../src/catalog-skill-classification.mjs';
import {loadCatalogWithContinuations} from '../src/catalog-continuation.mjs';
const usage='Use --summary or --query TEXT [--domain DOMAIN] [--limit 1..5]';
const args=process.argv.slice(2),summaryRequested=args[0]==='--summary';
if(summaryRequested)assert.equal(args.length,1,'Use --summary alone');
else assert(!args.includes('--summary'),'Use --summary alone');
const options={};
if(!summaryRequested)for(let i=0;i<args.length;i++){
  const key=args[i];assert(['--query','--domain','--limit'].includes(key)&&args[i+1]!==undefined,usage);
  options[key.slice(2)]=key==='--limit'?Number(args[++i]):args[++i];
}
const {sources,queue,classificationComplete,continuation,bodyStatuses}=await loadCatalogWithContinuations(fileURLToPath(new URL('../',import.meta.url)));
const summary={scope:'catalog801 cold source metadata; advisory domains are incomplete',networkCalls:0,classificationComplete,continuation,bodyStatuses};
if(summaryRequested)console.log(JSON.stringify({...summary,mode:'summary',sourceCount:sources.length,uniqueBodyCount:queue.length,authority:'none',activation:'none'},null,2));
else console.log(JSON.stringify({...summary,results:searchCatalogIntake(sources,queue,options)},null,2));
