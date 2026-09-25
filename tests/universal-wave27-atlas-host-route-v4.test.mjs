import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as product from '../product/lib/product.mjs';

const catalog=JSON.parse(await readFile(new URL('../product/catalog.json',import.meta.url),'utf8'));
const facts=(inputScope,connectedPurpose,discovery)=>({inputScope,connectedPurpose,discovery});

// Production break caught: a lexical Atlas shortlist is mistaken for permission
// to choose connected-source discovery despite an explicit supplied-only boundary.
test('five reviewed and two new supplied-only paraphrases reject connected source despite an Atlas shortlist',()=>{
  assert.equal(typeof product.routeTask,'function','a callable host route is required');
  const cases=[
    ['All required numbers are in the attached spreadsheet; do not discover or load connected data.',facts('supplied-only','none','prohibited')],
    ['Use only the attached workbook; no connected-source discovery or loading.',facts('supplied-only','none','prohibited')],
    ["The supplied CSV has everything. Don't browse available connector datasets.",facts('supplied-only','none','prohibited')],
    ['The report already includes the necessary data; confirm its calculations from the file without listing workspace datasets.',facts('supplied-only','none','prohibited')],
    ['Answer exclusively from the uploaded file; skip looking up any integrations or other datasets.',facts('supplied-only','none','prohibited')],
    ['The figures pasted here are complete; stay inside this material and make no outside dataset lookup.',facts('supplied-only','none','prohibited')],
    ['Compute the median from the supplied rows; integrations are off-limits for this task.',facts('supplied-only','none','prohibited')],
  ];
  for(const [query,context] of cases){
    const result=product.routeTask(catalog,query,context);
    assert.equal(result.atlas.connectedSource.state,'rejected',query);
    assert.equal(result.atlas.connectedSource.reason,'discovery-prohibited',query);
    assert.equal(result.atlas.localAnalysisAvailable,true,query);
  }
  const reviewed=cases.slice(0,5).map(([query])=>product.routeTask(catalog,query,facts('supplied-only','none','prohibited')));
  assert.ok(reviewed.every(result=>result.atlas.shortlisted),
    'the test must exercise the five lexical false positives rather than cases where Atlas was already absent');
});

// Production break caught: a prohibition is ignored when the same prompt also
// contains connected-source vocabulary or a purported discovery purpose.
test('explicit no-discovery and supplied-only facts take precedence over connected-purpose claims',()=>{
  assert.equal(typeof product.decideAtlasConnectedSource,'function');
  assert.deepEqual(product.decideAtlasConnectedSource(facts('unknown','inventory','prohibited')),
    {state:'rejected',reason:'discovery-prohibited'});
  assert.deepEqual(product.decideAtlasConnectedSource(facts('supplied-only','inventory','not-prohibited')),
    {state:'rejected',reason:'supplied-only'});
  const result=product.routeTask(catalog,
    'Calculate median revenue by region from the attached CSV only; do not discover a connected source.',
    facts('supplied-only','none','prohibited'));
  assert.equal(result.atlas.shortlisted,true);
  assert.equal(result.atlas.connectedSource.state,'rejected');
  assert.equal(result.atlas.localAnalysisAvailable,true);
});

// Production break caught: a default or malformed context silently enables a
// connector route from a catalog hit.
test('missing, unknown and contradictory task facts never enable connected-source eligibility',()=>{
  assert.equal(typeof product.decideAtlasConnectedSource,'function');
  for(const context of [undefined,{},facts('unknown','unknown','unknown'),facts('missing-input','fill-missing','unknown'),
    facts('sufficient','fill-missing','not-prohibited'),facts('missing-input','fill-missing',true),
    facts('unknown','inventory','not-prohibited')]){
    assert.equal(product.decideAtlasConnectedSource(context).state,'hold',JSON.stringify(context));
  }
  assert.deepEqual(product.decideAtlasConnectedSource(facts('sufficient','none','not-prohibited')),
    {state:'rejected',reason:'no-connected-question'});
});

// Production break caught: a global Atlas exclusion masks legitimate local
// analysis or explicit connected inventory/named-run questions.
test('explicit connected questions remain conditional candidates and local Atlas remains available',()=>{
  assert.equal(typeof product.routeTask,'function');
  const cases=[
    ['Which authorized workspace dataset can fill missing revenue columns?',facts('missing-input','fill-missing','not-prohibited')],
    ['What data collections are exposed by the approved workspace integration before opening rows?',facts('open','inventory','not-prohibited')],
    ['Did report run 17 actually read the selected input table?',facts('open','named-run','not-prohibited')],
    ['The attached CSV answers the calculation; separately, what datasets does our integration list?',facts('sufficient','inventory','not-prohibited')],
  ];
  for(const [query,context] of cases){
    const result=product.routeTask(catalog,query,context);
    assert.deepEqual(result.atlas.connectedSource,{state:'candidate',reason:'explicit-connected-question'},query);
    assert.equal(result.atlas.localAnalysisAvailable,true,query);
    assert.equal(result.search.authority,'none');
    assert.equal(result.search.activation,'none');
  }
});

// Production break caught: tests exercise a helper but the actual optional host
// entrypoint still exposes only lexical search, not the decision.
test('CLI route command calls the real host decision without connector access',()=>{
  const bin=fileURLToPath(new URL('../product/bin/godskills.mjs',import.meta.url));
  const query='Calculate median revenue by region from the attached CSV only; do not discover a connected source.';
  const run=spawnSync(process.execPath,[bin,'route',query,'--input-scope','supplied-only',
    '--connected-purpose','none','--discovery','prohibited'],{encoding:'utf8',windowsHide:true});
  assert.equal(run.status,0,run.stderr);
  const result=JSON.parse(run.stdout);
  assert.equal(result.atlas.shortlisted,true);
  assert.deepEqual(result.atlas.connectedSource,{state:'rejected',reason:'discovery-prohibited'});
  assert.equal(result.atlas.localAnalysisAvailable,true);
  const unknown=spawnSync(process.execPath,[bin,'route','Find connected workspace datasets'],{encoding:'utf8',windowsHide:true});
  assert.equal(unknown.status,0,unknown.stderr);
  assert.equal(JSON.parse(unknown.stdout).atlas.connectedSource.state,'hold');
  const omittedScope=spawnSync(process.execPath,[bin,'route','List available datasets in the workspace integration',
    '--connected-purpose','inventory','--discovery','not-prohibited'],{encoding:'utf8',windowsHide:true});
  assert.equal(omittedScope.status,0,omittedScope.stderr);
  assert.equal(JSON.parse(omittedScope.stdout).atlas.connectedSource.state,'hold');
});
