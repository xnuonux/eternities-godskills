const categories=new Set(['engineering','data','security','science','design','games','marketing','operations','writing','audio','knowledge','agriculture','education','finance','legal','unknown']);
export function bindDomainChunk({bodyHashes,snapshot,chunk}){
  const hashes=[...new Set(bodyHashes)].sort();
  if(!Number.isInteger(chunk.offset)||chunk.offset<0||chunk.offset>=hashes.length||chunk.offset%64!==0)throw new Error('Invalid chunk offset');
  if(!Array.isArray(chunk.judgments)||chunk.judgments.length!==Math.min(64,hashes.length-chunk.offset))throw new Error('Incomplete compact chunk');
  return chunk.judgments.map((judgment,n)=>{
    if(!judgment||Object.keys(judgment).sort().join(',')!=='category,gapLabel,possibleSkillIds')throw new Error('Invalid compact judgment fields');
    return {...judgment,bodySha256:hashes[chunk.offset+n],status:'metadata-reviewed',model:'gpt-5.6-luna',sourceSnapshot:snapshot};
  });
}
export function summarizeDomainReview({bodyHashes,skillIds,snapshot,rows}){
  const bodies=new Set(bodyHashes),skills=new Set(skillIds),seen=new Set(),counts={},gaps={};
  for(const row of rows){
    if(!bodies.has(row.bodySha256)||seen.has(row.bodySha256))throw new Error('Foreign or duplicate body review');
    if(row.sourceSnapshot!==snapshot||row.status!=='metadata-reviewed'||row.model!=='gpt-5.6-luna')throw new Error('Stale or unsupported review scope');
    if(!categories.has(row.category))throw new Error('Unknown category');
    if(!Array.isArray(row.possibleSkillIds)||row.possibleSkillIds.length>3||new Set(row.possibleSkillIds).size!==row.possibleSkillIds.length||row.possibleSkillIds.some(id=>!skills.has(id)))throw new Error('Invalid skill mapping');
    if(row.gapLabel!==null&&(typeof row.gapLabel!=='string'||row.gapLabel.length>250))throw new Error('Invalid gap label');
    seen.add(row.bodySha256);counts[row.category]=(counts[row.category]??0)+1;
    if(row.gapLabel)gaps[row.gapLabel]=(gaps[row.gapLabel]??0)+1;
  }
  return {schema:'universal-domain-review-summary-v1',status:seen.size===bodies.size?'metadata-review-complete':'partial',authority:'none',activation:'none',sourceSnapshot:snapshot,totalBodies:bodies.size,reviewedBodies:seen.size,remainingBodies:bodies.size-seen.size,unknownBodies:counts.unknown??0,skillPromotions:0,categories:Object.fromEntries(Object.entries(counts).sort()),gapLabels:Object.fromEntries(Object.entries(gaps).sort()),limits:'Metadata classification is advisory. It is not body review, semantic equivalence, skill incorporation or performance qualification.'};
}

export function mergeDomainRevisions({original,repair}){
  const originalSummary=summarizeDomainReview(original),repairSummary=summarizeDomainReview(repair);
  const admitted=new Set(original.bodyHashes);
  if(repair.bodyHashes.some(x=>!admitted.has(x)))throw new Error('Repair refers to a foreign body');
  const effective=new Map(original.rows.map(x=>[x.bodySha256,x]));
  for(const row of repair.rows)effective.set(row.bodySha256,row);
  const rows=[...effective.values()].sort((a,b)=>a.bodySha256<b.bodySha256?-1:a.bodySha256>b.bodySha256?1:0);
  // Only the count projection uses one snapshot; returned evidence retains each
  // row's real classification input snapshot, including corrected descriptions.
  const combined=summarizeDomainReview({...original,rows:rows.map(x=>({...x,sourceSnapshot:original.snapshot}))});
  return {rows,summary:{...combined,schema:'universal-domain-refinement-v1',status:originalSummary.status==='metadata-review-complete'&&repairSummary.status==='metadata-review-complete'?'metadata-review-complete':'partial',repairSnapshot:repair.snapshot,repairedMetadataBodies:repairSummary.reviewedBodies,remainingReclassification:repairSummary.remainingBodies,originalUnknownBodies:originalSummary.unknownBodies}};
}
