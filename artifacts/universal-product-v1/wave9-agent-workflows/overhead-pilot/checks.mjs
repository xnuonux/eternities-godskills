import assert from 'node:assert/strict';
const p=id=>({id,status:'passed'});
const c=(id,requires=[])=>({id,requires});
export async function evaluate(runChecks){
  const cases=[];
  async function check(name,fn){try{await fn();cases.push({name,pass:true});}catch(e){cases.push({name,pass:false,error:String(e?.message??e)});}}
  await check('shared prerequisites and repeated targets run once in declared traversal order',async()=>{
    const calls=[];const out=await runChecks([c('unused'),c('prep'),c('build',['prep','prep']),c('lint',['prep'])],['lint','build','lint'],id=>calls.push(id));
    assert.deepEqual(calls,['prep','lint','build']);assert.deepEqual(out,[p('prep'),p('lint'),p('build')]);
  });
  await check('empty targets validate but execute nothing',async()=>{let calls=0;assert.deepEqual(await runChecks([c('a')],[],()=>calls++),[]);assert.equal(calls,0);});
  await check('case-sensitive and object-property IDs are ordinary keys',async()=>{
    const calls=[];const out=await runChecks([c('__proto__'),c('constructor',['__proto__']),c('A'),c('a',['A'])],['constructor','a'],id=>calls.push(id));
    assert.deepEqual(calls,['__proto__','constructor','A','a']);assert.deepEqual(out,calls.map(p));
  });
  await check('sync failure blocks descendants but independent work continues',async()=>{
    const calls=[];const out=await runChecks([c('a'),c('b',['a']),c('end',['b','a','b']),c('free')],['end','free'],id=>{calls.push(id);if(id==='a')throw new Error('broken');});
    assert.deepEqual(calls,['a','free']);assert.deepEqual(out,[{id:'a',status:'failed',error:'broken'},{id:'b',status:'blocked',blockedBy:['a']},{id:'end',status:'blocked',blockedBy:['b','a']},p('free')]);
  });
  await check('async settlement is sequential and rejection is reported',async()=>{
    const trace=[];const out=await runChecks([c('a'),c('b')],['a','b'],async id=>{trace.push('start-'+id);await new Promise(r=>setImmediate(r));trace.push('end-'+id);if(id==='a')throw 'no';return false;});
    assert.deepEqual(trace,['start-a','end-a','start-b','end-b']);assert.deepEqual(out,[{id:'a',status:'failed',error:'no'},p('b')]);
  });
  await check('unknown target rejects before any valid target executes',async()=>{let calls=0;await assert.rejects(runChecks([c('a')],['a','missing'],()=>calls++),TypeError);assert.equal(calls,0);});
  await check('unselected unknown dependencies reject before execution',async()=>{let calls=0;await assert.rejects(runChecks([c('a'),c('bad',['missing'])],['a'],()=>calls++),TypeError);assert.equal(calls,0);});
  await check('unselected cycle rejects before execution',async()=>{let calls=0;await assert.rejects(runChecks([c('a'),c('x',['y']),c('y',['x'])],['a'],()=>calls++),TypeError);assert.equal(calls,0);});
  await check('duplicate catalog IDs reject before execution',async()=>{let calls=0;await assert.rejects(runChecks([c('a'),c('a')],['a'],()=>calls++),TypeError);assert.equal(calls,0);});
  await check('invalid types and sparse arrays reject before execution',async()=>{
    const samples=[[null,[]],[[null],[]],[[{id:'a'}],[]],[[c(' ')],[]],[[c('a','a')],[]],[[c('a',[null])],[]],[[c('a')],null],[[c('a')],[null]],[[c('a')],[' ']],[[c('a'),,c('b')],['a']],[[c('a',Array(1))],[]],[[c('a')],Array(1)]];
    for(const [catalog,targets]of samples){let calls=0;await assert.rejects(runChecks(catalog,targets,()=>calls++),TypeError);assert.equal(calls,0);}
    await assert.rejects(runChecks([c('a')],[],null),TypeError);
  });
  await check('frozen inputs remain untouched and exact spaced IDs are preserved',async()=>{
    const checks=Object.freeze([Object.freeze({id:' a ',requires:Object.freeze([])}),Object.freeze({id:'b',requires:Object.freeze([' a '])})]);const targets=Object.freeze(['b']);
    assert.deepEqual(await runChecks(checks,targets,()=>{}),[p(' a '),p('b')]);
  });
  await check('separate invocations do not share cached execution results',async()=>{
    let calls=0;const checks=[c('a')];await runChecks(checks,['a'],()=>{calls++;throw 'first';});assert.deepEqual(await runChecks(checks,['a'],()=>{calls++;}),[p('a')]);assert.equal(calls,2);
  });
  return{kind:'executed-contract-checks',passed:cases.filter(x=>x.pass).length,total:cases.length,cases};
}
