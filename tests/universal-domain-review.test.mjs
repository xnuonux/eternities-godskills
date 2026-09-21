import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeDomainReview,bindDomainChunk,mergeDomainRevisions} from '../src/universal-domain-review.mjs';
const a='a'.repeat(64),b='b'.repeat(64),snapshot='c'.repeat(64);
const row=(digest=a)=>({bodySha256:digest,category:'engineering',possibleSkillIds:['build'],gapLabel:null,status:'metadata-reviewed',model:'gpt-5.6-luna',sourceSnapshot:snapshot});
test('alias sources count once and incomplete review remains explicitly partial',()=>{
  const result=summarizeDomainReview({bodyHashes:[a,a,b],skillIds:['build'],snapshot,rows:[row()]});
  assert.equal(result.status,'partial');assert.equal(result.totalBodies,2);assert.equal(result.reviewedBodies,1);assert.equal(result.remainingBodies,1);assert.equal(result.authority,'none');
});
test('unknowns and possible mappings never claim synthesis or promotion',()=>{
  const result=summarizeDomainReview({bodyHashes:[a],skillIds:['build'],snapshot,rows:[{...row(),category:'unknown',possibleSkillIds:[]}]});
  assert.equal(result.status,'metadata-review-complete');assert.equal(result.unknownBodies,1);assert.equal(result.skillPromotions,0);
});
test('duplicate, foreign, stale and invalid classifier rows fail closed',()=>{
  const input={bodyHashes:[a],skillIds:['build'],snapshot};
  for(const rows of [[row(),row()],[row(b)],[{...row(),sourceSnapshot:b}],[{...row(),possibleSkillIds:['missing']}],[{...row(),category:'invalid'}]])assert.throws(()=>summarizeDomainReview({...input,rows}));
});
test('compact judgments are rebound to exact sorted source hashes without model transcription',()=>{
  const judgment={category:'engineering',possibleSkillIds:['build'],gapLabel:null};
  const bound=bindDomainChunk({bodyHashes:[b,a,a],snapshot,chunk:{offset:0,judgments:[judgment,judgment]}});
  assert.deepEqual(bound.map(x=>x.bodySha256),[a,b]);assert.ok(bound.every(x=>x.sourceSnapshot===snapshot));
  assert.throws(()=>bindDomainChunk({bodyHashes:[a,b],snapshot,chunk:{offset:0,judgments:[judgment]}}));
  assert.throws(()=>bindDomainChunk({bodyHashes:[a,b],snapshot,chunk:{offset:-1,judgments:[]}}));
});

test('corrected metadata supersedes only its exact body and preserves both input snapshots',()=>{
  const repairSnapshot='d'.repeat(64);
  const original={bodyHashes:[a,b],skillIds:['build'],snapshot,rows:[{...row(),category:'unknown',possibleSkillIds:[]},row(b)]};
  const repair={bodyHashes:[a],skillIds:['build'],snapshot:repairSnapshot,rows:[{...row(),sourceSnapshot:repairSnapshot}]};
  const result=mergeDomainRevisions({original,repair});
  assert.equal(result.summary.status,'metadata-review-complete');
  assert.equal(result.summary.unknownBodies,0);
  assert.equal(result.summary.repairedMetadataBodies,1);
  assert.equal(result.summary.skillPromotions,0);
  assert.equal(result.rows.find(x=>x.bodySha256===a).sourceSnapshot,repairSnapshot);
  assert.equal(original.rows[0].category,'unknown');
  const partial=mergeDomainRevisions({original,repair:{...repair,rows:[]}});
  assert.equal(partial.summary.status,'partial');assert.equal(partial.summary.remainingReclassification,1);
  assert.throws(()=>mergeDomainRevisions({original,repair:{...repair,bodyHashes:['e'.repeat(64)],rows:[]}}));
});
