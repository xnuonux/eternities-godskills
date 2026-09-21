import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLauncherBody} from '../src/launcher-body-form.mjs';

const name='Example',description='A named capability.';
const body='# Example\n\nA named capability.\n\n## Usage\n\nThis skill can be used standalone or as part of an Agent workflow on SkillsHub.\n\n### Standalone\n\n```\nskillshub run owner/example --input "Your query here"\n```\n\n### In Agent\n\nAdd this skill to your Agent configuration to enable its capabilities.';

test('exact known launcher body is recognized under LF or CRLF without granting quality or execution authority',()=>{
  for(const value of [body,body.replaceAll('\n','\r\n')]){
    const result=inspectLauncherBody({body:value,name,description});
    assert.deepEqual(result,{kind:'known-launcher-template',template:'skillshub-description-launcher-v1',launcherId:'owner/example',scope:'body-only',operationalMethodEstablished:false});
  }
});

test('additional mechanisms or instructions prevent blanket launcher classification',()=>{
  for(const value of [body+'\n\n## Method\nCheck the denominator before division.',body.replace('### Standalone','### Standalone\n\nApply a scenario ledger first.'),body.replace(' --input','; other-command --input')]){
    assert.equal(inspectLauncherBody({body:value,name,description}).kind,'unmatched');
  }
});

test('metadata mismatch, missing metadata and short substantive methods remain unclassified',()=>{
  for(const input of [{body,name:'Different',description},{body,name,description:'Different'},{body,name},{body:'Compare like-for-like periods and preserve missing values.',name,description}]){
    assert.equal(inspectLauncherBody(input).kind,'unmatched');
  }
});

test('a launcher token cannot contain shell operators or whitespace and nothing is executed',()=>{
  for(const token of ['owner/example && bad','owner/../example','owner/example\nextra','owner/example;bad','owner/example/child']){
    assert.equal(inspectLauncherBody({body:body.replace('owner/example',token),name,description}).kind,'unmatched');
  }
});
