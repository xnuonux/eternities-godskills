import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {evaluate} from './checks.mjs';
try {
  const mod=await import(pathToFileURL(resolve(process.argv[2])).href);
  if(typeof mod.runChecks!=='function')throw new Error('Missing runChecks export');
  const result=await evaluate(mod.runChecks);console.log(JSON.stringify(result,null,2));process.exitCode=result.passed===result.total?0:1;
}catch(e){console.log(JSON.stringify({kind:'invalid-or-unavailable-artifact',error:String(e?.message??e)},null,2));process.exitCode=2;}
