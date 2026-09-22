// Oracle implementation, never supplied to either consumer.
export async function runChecks(checks,targets,execute){
  const validId=x=>typeof x==='string'&&x.trim().length>0;
  if(!Array.isArray(checks)||!Array.isArray(targets)||typeof execute!=='function')throw new TypeError('Invalid arguments');
  const catalog=new Map();
  for(const record of checks){
    if(!record||typeof record!=='object'||Array.isArray(record)||!validId(record.id)||!Array.isArray(record.requires)||catalog.has(record.id))throw new TypeError('Invalid check');
    for(const dep of record.requires)if(!validId(dep))throw new TypeError('Invalid prerequisite');
    catalog.set(record.id,[...new Set(record.requires)]);
  }
  for(const deps of catalog.values())for(const dep of deps)if(!catalog.has(dep))throw new TypeError('Unknown prerequisite');
  for(const target of targets)if(!validId(target)||!catalog.has(target))throw new TypeError('Unknown target');
  const colors=new Map();
  function validate(id){
    if(colors.get(id)===1)throw new TypeError('Cycle');
    if(colors.get(id)===2)return;
    colors.set(id,1);for(const dep of catalog.get(id))validate(dep);colors.set(id,2);
  }
  for(const id of catalog.keys())validate(id);
  const order=[],seen=new Set();
  function visit(id){if(seen.has(id))return;seen.add(id);for(const dep of catalog.get(id))visit(dep);order.push(id);}
  for(const target of targets)visit(target);
  const results=new Map();
  for(const id of order){
    const blockedBy=catalog.get(id).filter(dep=>results.get(dep).status!=='passed');
    if(blockedBy.length){results.set(id,{id,status:'blocked',blockedBy});continue;}
    try{await execute(id);results.set(id,{id,status:'passed'});}
    catch(error){results.set(id,{id,status:'failed',error:error instanceof Error?error.message:String(error)});}
  }
  return [...results.values()];
}
