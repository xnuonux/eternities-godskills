import test from 'node:test';
import assert from 'node:assert/strict';
import { searchColdIntakes } from '../src/cold-intake-search.mjs';
const h='a'.repeat(64), other='b'.repeat(64);
const source={sourceId:'one@revision:SKILL.md',bodySha256:h,name:'robotics-testing',description:'Review robot simulation safety and regression tests',repository:'one/repo',path:'SKILL.md'};
const label={bodySha256:h,facets:{verify:{value:'yes',confidence:.95,status:'provisional'}}};
test('search returns bounded inert metadata, never full source instructions',()=>{
 const result=searchColdIntakes([source],[],{query:'robot simulation'});
 assert.equal(result.length,1);assert.equal(result[0].activation,'none');assert.equal(result[0].sourceId,source.sourceId);assert.equal(result[0].body,undefined);
});
test('identical bodies appear once with all provenance aliases',()=>{
 const result=searchColdIntakes([source,{...source,sourceId:'copy@revision:SKILL.md'}],[],{query:'robot'});
 assert.equal(result.length,1);assert.equal(result[0].aliases.length,2);
});
test('contradictory source identities are excluded instead of silently overwritten',()=>{
 assert.equal(searchColdIntakes([source,{...source,bodySha256:other}],[],{query:'robot'}).length,0);
});
test('facet filter accepts only matching-body provisional positive decisions',()=>{
 assert.equal(searchColdIntakes([source],[label],{query:'robot',facet:'verify'}).length,1);
 for(const bad of [{...label,bodySha256:other},{...label,facets:{verify:{value:'unknown',status:'needs-review'}}},{...label,facets:{verify:{value:'yes',status:'needs-review'}}}])assert.equal(searchColdIntakes([source],[bad],{query:'robot',facet:'verify'}).length,0);
});
test('conflicting facet rows cannot make a source pass a filter',()=>{
 const negative={...label,facets:{verify:{value:'no',confidence:.99,status:'provisional'}}};
 assert.equal(searchColdIntakes([source],[label,negative],{query:'robot',facet:'verify'}).length,0);
});
test('no-match and invalid options do not dump the corpus',()=>{
 assert.equal(searchColdIntakes([source],[],{query:'unrelated'}).length,0);
 for(const opts of [{query:''},{query:'robot',limit:6},{query:'robot',facet:'execute'}])assert.throws(()=>searchColdIntakes([source],[],opts));
});
test('malformed duplicate rows cannot reenter through a valid source id',()=>{
 const result=searchColdIntakes([source,{...source,bodySha256:null}],[],{query:'robot'});
 assert.equal(result.length,1);assert.equal(result[0].bodySha256,h);
});
