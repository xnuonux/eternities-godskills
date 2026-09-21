import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeDomainReview,bindDomainChunk} from '../src/universal-domain-review.mjs';
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
