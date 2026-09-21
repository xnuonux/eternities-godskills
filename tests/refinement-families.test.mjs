import test from 'node:test';
import assert from 'node:assert/strict';
import * as moduleUnderTest from '../src/refinement-families.mjs';
const hash=n=>n.toString(16).padStart(64,'0');
const families=[{id:'data-analysis',scope:'Data analysis and plots',ownerIds:['atlas']},{id:'unresolved-source-scope',scope:'Unknown source scope',ownerIds:[]}];
function input(){return {queue:[{bodySha256:hash(2),sourceId:'repo:b',name:'B',category:'data',gapLabel:'analysis'},{bodySha256:hash(1),sourceId:'repo:a',name:'A',category:'unknown',gapLabel:null},{bodySha256:hash(3),sourceId:'repo:c',name:'C',category:'data',gapLabel:null}],descriptions:{[hash(2)]:'Make a chart'},families,skillIds:['atlas'],releaseId:hash(9)};}
test('research packet retains gaps and unresolved sources in a stable body-bound order',()=>{
  assert.equal(typeof moduleUnderTest.createFamilyPacket,'function');
  const p=moduleUnderTest.createFamilyPacket(input());
  assert.deepEqual(p.items.map(x=>[x.id,x.bodySha256]),[['r0000',hash(1)],['r0001',hash(2)]]);
  assert.equal(p.totalQueueBodies,3);assert.equal(p.items[1].description,'Make a chart');
  assert.equal(p.authority,'none');assert.equal(p.activation,'none');
  const reversed=input();reversed.queue.reverse();assert.deepEqual(moduleUnderTest.createFamilyPacket(reversed),p);
});
test('packet rejects duplicate bodies and dangling owners rather than losing evidence',()=>{
  for(const [edit,message] of [[x=>x.queue.push(x.queue[0]),/duplicate body/],[x=>x.skillIds=[],/unknown owner/],[x=>x.releaseId='bad',/releaseId/]]){
    const x=input();edit(x);assert.throws(()=>moduleUnderTest.createFamilyPacket(x),message);
  }
});
test('packet identity changes with metadata, family definitions and product release',()=>{
  const p=moduleUnderTest.createFamilyPacket(input());
  for(const edit of [x=>x.descriptions[hash(2)]='Different scope',x=>x.releaseId=hash(8),x=>x.families=[{...families[0],scope:'Changed'},families[1]]]){
    const x=input();edit(x);assert.notEqual(moduleUnderTest.createFamilyPacket(x).snapshot,p.snapshot);
  }
});
test('missing source names remain explicit metadata gaps',()=>{
  const x=input();x.queue[0].name=null;
  assert.equal(moduleUnderTest.createFamilyPacket(x).items[1].name,null);
});
test('compact chunks bind exact rows without accepting stale snapshots or partial assignments',()=>{
  const p=moduleUnderTest.createFamilyPacket(input());
  assert.equal(typeof moduleUnderTest.bindFamilyChunk,'function');
  const c={snapshot:p.snapshot,offset:0,rows:[['unresolved-source-scope','unclear','No useful description'],['data-analysis','method-candidate','Chart procedure needs review']]};
  const rows=moduleUnderTest.bindFamilyChunk(p,c);
  assert.deepEqual(rows.map(x=>x.bodySha256),[hash(1),hash(2)]);
  assert.equal(rows[1].bodyReview,'not-established-by-family-assignment');
  for(const edit of [x=>x.snapshot=hash(5),x=>x.offset=-1,x=>x.rows[0][0]='invented',x=>x.rows[0][1]='certified',x=>x.rows[0][2]='',x=>x.rows.push(x.rows[0])]){const wrong=structuredClone(c);edit(wrong);assert.throws(()=>moduleUnderTest.bindFamilyChunk(p,wrong));}
});
test('family plan accounts for missing rows and rejects duplicate coverage',()=>{
  const p=moduleUnderTest.createFamilyPacket(input());
  const rows=moduleUnderTest.bindFamilyChunk(p,{snapshot:p.snapshot,offset:0,rows:[['unresolved-source-scope','unclear','Need body']]});
  assert.equal(typeof moduleUnderTest.summarizeFamilyPlan,'function');
  const result=moduleUnderTest.summarizeFamilyPlan(p,rows);
  assert.equal(result.summary.assigned,1);assert.equal(result.summary.remaining,1);assert.equal(result.summary.promotions,0);
  assert.equal(result.rows[1].disposition,'unassigned');
  assert.throws(()=>moduleUnderTest.summarizeFamilyPlan(p,[...rows,...rows]),/duplicate/i);
  assert.throws(()=>moduleUnderTest.summarizeFamilyPlan(p,[{...rows[0],bodySha256:hash(99)}]),/body|binding/i);
  assert.throws(()=>moduleUnderTest.summarizeFamilyPlan(p,[{...rows[0],id:'unknown',bodySha256:undefined}]),/body|binding/i);
  assert.throws(()=>moduleUnderTest.summarizeFamilyPlan(p,[{...rows[0],sourceId:'replacement-source'}]),/unexpected/i);
});
test('assignment processing rejects mutated packet or cross-snapshot results',()=>{
  const p=moduleUnderTest.createFamilyPacket(input());
  const c={snapshot:p.snapshot,offset:0,rows:[['unresolved-source-scope','unclear','Need source']]};
  const rows=moduleUnderTest.bindFamilyChunk(p,c);
  assert.throws(()=>moduleUnderTest.summarizeFamilyPlan(p,[{...rows[0],snapshot:hash(88)}]),/snapshot/i);
  const changed=structuredClone(p);changed.items[0].name='Mutated';
  assert.throws(()=>moduleUnderTest.bindFamilyChunk(changed,c),/snapshot/i);
});
test('a frozen packet cannot be silently replaced under existing reviews',()=>{
  const p=moduleUnderTest.createFamilyPacket(input());
  assert.doesNotThrow(()=>moduleUnderTest.assertSameFamilyPacket(p,structuredClone(p)));
  const x=input();x.releaseId=hash(7);
  assert.throws(()=>moduleUnderTest.assertSameFamilyPacket(p,moduleUnderTest.createFamilyPacket(x)),/frozen.*mismatch/i);
});
