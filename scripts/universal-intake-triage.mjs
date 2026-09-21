import {readFile} from 'node:fs/promises';
const rows=(await readFile(new URL('../data/quarry-intake-2026-09-21-exa/sources.jsonl',import.meta.url),'utf8')).trim().split(/\r?\n/).map(JSON.parse);
const groups=new Map();
for(const row of rows){if(!groups.has(row.bodySha256))groups.set(row.bodySha256,[]);groups.get(row.bodySha256).push(row);}
const items=[...groups.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([digest,aliases])=>({id:digest,text:JSON.stringify({repository:aliases[0].repository,name:aliases[0].name,path:aliases[0].path,description:aliases[0].description?.slice(0,600)}),aliasCount:aliases.length}));
const offset=Number(process.argv[2]??0),limit=Number(process.argv[3]??64);
if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>64)throw new Error('Invalid bounded slice');
console.log(JSON.stringify({total:items.length,offset,items:items.slice(offset,offset+limit)}));
