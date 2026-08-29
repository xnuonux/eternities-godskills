import path from "node:path";

import { loadQuarryAtlas, searchQuarryAtlas } from "../src/quarry-atlas.mjs";

function parseArgs(argv) {
  const options = { limit: 5 };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--query") options.query = argv[++index];
    else if (value === "--family") options.family = argv[++index];
    else if (value === "--limit") options.limit = Number(argv[++index]);
    else throw new Error(`unknown argument: ${value}`);
  }
  return options;
}

const atlas = await loadQuarryAtlas(path.resolve("."));
console.log(JSON.stringify(searchQuarryAtlas(atlas, parseArgs(process.argv.slice(2))), null, 2));
