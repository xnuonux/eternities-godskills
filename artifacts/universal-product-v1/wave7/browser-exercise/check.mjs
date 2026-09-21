import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const target=process.argv[2];if(!target)throw Error('Supply the candidate module path');
const {createSceneController}=await import(pathToFileURL(resolve(target)).href);
assert.equal(typeof createSceneController,'function');
const turn=()=>new Promise(setImmediate);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(){
  let serial=0;const frames=new Map(),loads=[],events=[];
  const adapter={
    requestFrame(cb){const id=++serial;frames.set(id,cb);return id;},
    cancelFrame(id){frames.delete(id);events.push(['cancel',id]);},
    loadAsset(){const d=deferred();loads.push(d);return d.promise;},
    attachAsset(a){events.push(['attach',a.id]);},
    detachAsset(a){events.push(['detach',a.id]);},
    disposeAsset(a){events.push(['dispose',a.id]);},
    render(dt){events.push(['render',dt]);},
    onError(e){events.push(['error',e.message]);},
  };
  const controller=createSceneController(adapter);
  return {controller,frames,loads,events,
    step(time){assert.equal(frames.size,1);const [id,cb]=frames.entries().next().value;frames.delete(id);cb(time);},
    values(kind){return events.filter(x=>x[0]===kind).map(x=>x[1]);}};
}
const cases=[
  ['inert-construction',async()=>{const f=fixture();assert.equal(f.frames.size,0);assert.equal(f.loads.length,0);assert.deepEqual(f.events,[]);}],
  ['duplicate-start',async()=>{const f=fixture();f.controller.start();f.controller.start();assert.equal(f.frames.size,1);assert.equal(f.loads.length,1);f.controller.stop();}],
  ['bounded-frame-deltas',async()=>{const f=fixture();f.controller.start();for(const t of [1000,1050,20000,19999])f.step(t);assert.deepEqual(f.values('render'),[0,.05,.1,0]);assert.equal(f.frames.size,1);f.controller.stop();}],
  ['owned-stop-idempotent',async()=>{const f=fixture();f.controller.start();f.loads[0].resolve({id:'owned',ownership:'owned'});await turn();f.controller.stop();f.controller.stop();assert.equal(f.frames.size,0);assert.deepEqual(f.values('attach'),['owned']);assert.deepEqual(f.values('detach'),['owned']);assert.deepEqual(f.values('dispose'),['owned']);}],
  ['stale-frame-does-not-revive',async()=>{const f=fixture();f.controller.start();const cb=f.frames.values().next().value;f.controller.stop();cb(1000);assert.deepEqual(f.values('render'),[]);assert.equal(f.frames.size,0);}],
  ['late-owned-lease-released',async()=>{const f=fixture();f.controller.start();f.controller.stop();f.loads[0].resolve({id:'late',ownership:'owned'});await turn();assert.deepEqual(f.values('attach'),[]);assert.deepEqual(f.values('dispose'),['late']);}],
  ['borrowed-lease-not-disposed',async()=>{const f=fixture();f.controller.start();f.loads[0].resolve({id:'shared',ownership:'borrowed'});await turn();f.controller.stop();assert.deepEqual(f.values('detach'),['shared']);assert.deepEqual(f.values('dispose'),[]);f.controller.start();f.controller.stop();f.loads[1].resolve({id:'late-shared',ownership:'borrowed'});await turn();assert.deepEqual(f.values('attach'),['shared']);assert.deepEqual(f.values('dispose'),[]);}],
  ['restart-keeps-load-generations-separate',async()=>{const f=fixture();f.controller.start();const oldCallback=f.frames.values().next().value;f.controller.stop();f.controller.start();f.loads[0].resolve({id:'old',ownership:'owned'});f.loads[1].resolve({id:'new',ownership:'owned'});await turn();oldCallback(1000);assert.equal(f.frames.size,1);assert.deepEqual(f.values('render'),[]);assert.deepEqual(f.values('attach'),['new']);assert.deepEqual(f.values('dispose'),['old']);f.controller.stop();assert.deepEqual(f.values('detach'),['new']);assert.deepEqual(f.values('dispose'),['old','new']);}],
  ['current-and-obsolete-errors-distinguished',async()=>{const f=fixture();f.controller.start();f.loads[0].reject(new Error('current'));await turn();assert.deepEqual(f.values('error'),['current']);f.controller.stop();f.controller.start();f.controller.stop();f.controller.start();f.loads[1].reject(new Error('obsolete'));await turn();assert.deepEqual(f.values('error'),['current']);assert.equal(f.frames.size,1);f.controller.stop();}],
  ['resume-rebases-clock',async()=>{const f=fixture();f.controller.start();f.step(50);f.step(100);f.controller.stop();f.controller.start();f.step(900000);assert.deepEqual(f.values('render'),[0,.05,0]);f.controller.stop();}],
];
const results=[];for(const [name,run]of cases){try{await run();results.push({name,status:'pass'});}catch(e){results.push({name,status:'fail',error:e.message});}}
console.log(JSON.stringify({scope:'synthetic-controller-contract',passed:results.filter(x=>x.status==='pass').length,failed:results.filter(x=>x.status==='fail').length,results},null,2));
if(results.some(x=>x.status==='fail'))process.exitCode=1;
