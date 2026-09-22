import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {searchCatalogIntake} from '../src/catalog-skill-classification.mjs';
import {loadCatalogWithContinuations} from '../src/catalog-continuation.mjs';
const args=process.argv.slice(2);
const summary=args.length===1&&args[0]==='--summary';
assert(!args.includes('--summary')||summary,'--summary must be used alone');
const options={};
if(!summary)for(let i=0;i<args.length;i++){
  const key=args[i];assert(['--query','--domain','--limit'].includes(key)&&args[i+1]!==undefined,'Use --query TEXT [--domain DOMAIN] [--limit 1..5]');
  options[key.slice(2)]=key==='--limit'?Number(args[++i]):args[++i];
}
const {sources,queue,classificationComplete,continuation,bodyStatuses}=await loadCatalogWithContinuations(fileURLToPath(new URL('../',import.meta.url)));
const common={scope:'catalog801 cold source metadata; advisory domains are incomplete',networkCalls:0,classificationComplete,continuation,bodyStatuses};
console.log(JSON.stringify(summary?{...common,mode:'summary',sourceCount:sources.length,uniqueBodyCount:queue.length,authority:'none',activation:'none'}:{...common,results:searchCatalogIntake(sources,queue,options)},null,2));
