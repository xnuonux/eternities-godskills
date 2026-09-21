import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const bytes=await readFile(new URL('../data/universal-product-v1/metadata-description-repairs.json',import.meta.url));
const data=JSON.parse(bytes),rows=[...data.repairs].sort((a,b)=>a.bodySha256<b.bodySha256?-1:a.bodySha256>b.bodySha256?1:0);
const offset=Number(process.argv[2]??0),limit=Number(process.argv[3]??64);
if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>64)throw new Error('Invalid bounded slice');
console.log(JSON.stringify({total:rows.length,offset,sourceSnapshot:createHash('sha256').update(bytes).digest('hex'),items:rows.slice(offset,offset+limit).map(x=>({id:x.bodySha256,repository:x.repository,path:x.path,name:x.name,description:x.description.slice(0,1600)}))}));
