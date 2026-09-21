import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDescription} from '../src/skill-description-repair.mjs';

test('folded and literal frontmatter descriptions preserve actual text',()=>{
  assert.deepEqual(extractDescription('---\nname: demo\ndescription: >-\n  Search documents and\n  verify their citations.\ncategory: data\n---\n# Ignored body'),{status:'parsed',description:'Search documents and verify their citations.'});
  assert.equal(extractDescription('---\r\ndescription: |\r\n  first line\r\n  second line\r\n---\r\n').description,'first line\nsecond line');
});
test('quoted and plain scalar descriptions are handled without evaluation',()=>{
  assert.equal(extractDescription('---\ndescription: "A \\"quoted\\" value"\n---').description,'A "quoted" value');
  assert.equal(extractDescription('---\ndescription: "unterminated\n---').status,'unsupported');
  assert.equal(extractDescription('---\ndescription: "A useful value"\n---').description,'A useful value');
  assert.equal(extractDescription("---\ndescription: 'Author''s method'\n---").description,"Author's method");
  assert.equal(extractDescription('---\ndescription: Work with C# code # note\n---').description,'Work with C# code');
});
test('absent, ambiguous, tagged and malformed metadata never becomes a confident label',()=>{
  for(const text of ['description: outside a header','---\nname: demo\n---','---\ndescription: >-\nnext: no text\n---','---\ndescription: !!js/function code\n---','---\ndescription: *alias\n---','---\ndescription: one\ndescription: two\n---','---\ndescription: [one,two]\n---'])assert.notEqual(extractDescription(text).status,'parsed');
});
