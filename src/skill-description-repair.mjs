// Conservative scalar extraction for research metadata, not a general YAML loader.
// Unsupported forms remain unknown; no tags, aliases, objects or code are evaluated.
export function extractDescription(text){
  const header=/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if(!header)return {status:'missing'};
  const lines=header[1].split(/\r?\n/), matches=[];
  for(let n=0;n<lines.length;n++)if(/^description\s*:/.test(lines[n]))matches.push(n);
  if(matches.length!==1)return {status:matches.length?'unsupported':'missing'};
  const index=matches[0],value=lines[index].replace(/^description\s*:\s*/,'').trim();
  let description;
  if(/^[>|][+-]?(?:\s+#.*)?$/.test(value)){
    const body=[];
    for(let n=index+1;n<lines.length;n++){
      if(lines[n].trim()&&!/^ +\S/.test(lines[n]))break;
      body.push(lines[n]);
    }
    const nonempty=body.filter(x=>x.trim());
    if(!nonempty.length)return {status:'unsupported'};
    const indent=Math.min(...nonempty.map(x=>/^ */.exec(x)[0].length));
    description=body.map(x=>x.slice(indent)).join(value[0]==='>'?' ':'\n').trim();
  }else if(value.startsWith('"')){
    try{description=JSON.parse(value);}catch{return {status:'unsupported'};}
  }else if(value.startsWith("'")){
    if(!/^'(?:[^']|'')*'$/.test(value))return {status:'unsupported'};
    description=value.slice(1,-1).replaceAll("''","'");
  }else{
    if(!value||/^[!&*\[\]{}>|#]|^(?:null|true|false|~|[-+]?\d+(?:\.\d+)?)$/i.test(value))return {status:'unsupported'};
    // Indented continuation is not silently discarded from a plain scalar.
    if(lines[index+1]?.trim()&&/^ +\S/.test(lines[index+1]))return {status:'unsupported'};
    description=value.replace(/\s+#.*$/,'').trim();
  }
  return typeof description==='string'&&description.trim()?{status:'parsed',description:description.trim()}:{status:'unsupported'};
}
