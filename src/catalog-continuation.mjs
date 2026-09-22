import assert from 'node:assert/strict';
import {readFile,lstat,realpath} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createClassificationRequests,buildClassifiedQueue,normalizeJevReceipt,classificationsComplete} from './catalog-skill-classification.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const rows=b=>b.toString().trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const serialized=xs=>xs.map(x=>JSON.stringify(x)).join('\n')+'\n';
const intake='data/quarry-intake-2026-09-21-catalog801/';
const manifestPath='artifacts/catalog801-continuations/manifest.json';

// This is an explicitly maintained evidence list, not discovery or installation.
export async function loadCatalogWithContinuations(repositoryRoot){
  const root=await realpath(repositoryRoot);
  async function read(path){
    assert(typeof path==='string'&&/^[A-Za-z0-9._/-]+$/.test(path)&&!path.startsWith('/'),'Invalid evidence path');
    const parts=path.split('/');
    assert(parts.every(p=>p&&p!=='.'&&p!=='..'),'Invalid evidence path');
    let current=root;
    for(let i=0;i<parts.length;i++){
      current=join(current,parts[i]);const stat=await lstat(current);
      assert(!stat.isSymbolicLink(),'Linked evidence path');
      assert(i===parts.length-1?stat.isFile():stat.isDirectory(),'Non-regular evidence path');
    }
    assert.equal(await realpath(current),resolve(root,...parts),'Evidence path changed');
    return readFile(current);
  }
  async function bound(path,digest){
    assert(typeof digest==='string'&&/^[a-f0-9]{64}$/.test(digest),'Invalid evidence digest');
    const bytes=await read(path);assert.equal(sha(bytes),digest,`Changed evidence: ${path}`);return bytes;
  }
  const overlayBytes=await read(manifestPath),overlay=JSON.parse(overlayBytes);
  assert.equal(overlay.schema,'catalog-continuation-v1');
  assert(Array.isArray(overlay.receipts),'Missing continuation receipt list');
  const manifest=JSON.parse(await bound(intake+'manifest.json',overlay.intakeManifestSha256));
  const summary=JSON.parse(await bound(intake+'classification-summary.json',overlay.classificationSummarySha256));
  assert.equal(summary.intakeManifestSha256,overlay.intakeManifestSha256);
  assert.equal(summary.requestPlanSha256,overlay.requestPlanSha256);
  const [sources,inputs,groups]=await Promise.all(['sources.jsonl','classification-inputs.jsonl','body-groups.jsonl'].map(async p=>rows(await bound(intake+p,manifest.outputs[p].sha256))));
  const queueBytes=await bound(intake+'refinement-queue.jsonl',summary.queueSha256);
  const plan=JSON.parse(await bound(intake+'jev-request-plan-receipt.json',overlay.requestPlanReceiptSha256));
  const requests=createClassificationRequests(inputs,groups);
  assert.equal(sha(serialized(requests)),overlay.requestPlanSha256,'Changed request plan');
  assert.equal(plan.persistedRequestPlanSha256,overlay.requestPlanSha256,'Changed dispatched plan binding');
  const originals=[];
  for(const entry of summary.receiptFiles){
    assert(/^jev-receipts\/[A-Za-z0-9-]+\.json$/.test(entry.path),'Invalid original receipt path');
    originals.push(JSON.parse(await bound(intake+entry.path,entry.sha256)));
  }
  const originalQueue=buildClassifiedQueue(inputs,groups,requests,originals);
  assert.equal(serialized(originalQueue),queueBytes.toString(),'Frozen queue differs from original receipts');
  const continuations=[],paths=new Set();
  for(const entry of overlay.receipts){
    assert(typeof entry.path==='string'&&entry.path.startsWith('artifacts/'),'Receipt outside artifacts');
    assert(!paths.has(entry.path),'Duplicate continuation path');paths.add(entry.path);
    continuations.push(JSON.parse(await bound(entry.path,entry.sha256)));
  }
  // The existing builder rejects foreign requests and duplicate request/input labels
  // across the complete receipt set, and validates each exact provider binding.
  const queue=buildClassifiedQueue(inputs,groups,requests,[...originals,...continuations]);
  const requestMap=new Map(requests.map(x=>[x.request_id,x])),inputStatuses={};
  for(const receipt of continuations)for(const label of normalizeJevReceipt(requestMap.get(receipt.request_id),receipt).labels){
    inputStatuses[label.classificationStatus]=(inputStatuses[label.classificationStatus]??0)+1;
  }
  const bodyStatuses={};for(const row of queue)bodyStatuses[row.classificationStatus]=(bodyStatuses[row.classificationStatus]??0)+1;
  return{sources,queue,classificationComplete:classificationsComplete(queue),continuation:{manifestPath,manifestSha256:sha(overlayBytes),providerReceipts:continuations.length,inputStatuses},bodyStatuses};
}
