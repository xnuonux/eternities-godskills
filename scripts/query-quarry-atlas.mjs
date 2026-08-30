import path from "node:path";

import { loadVerifiedAtlas, searchQuarryAtlas } from "../src/quarry-atlas.mjs";

function parseArgs(argv) {
  const options = { limit: 5 };
  let version = "v2";
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--query") options.query = argv[++index];
    else if (value === "--family") options.family = argv[++index];
    else if (value === "--limit") options.limit = Number(argv[++index]);
    else if (value === "--atlas-version") version = argv[++index];
    else throw new Error(`unknown argument: ${value}`);
  }
  return { options, version };
}

const { options, version } = parseArgs(process.argv.slice(2));
const atlas = await loadVerifiedAtlas(path.resolve("."), { version });
console.log(JSON.stringify(searchQuarryAtlas(atlas, options), null, 2));
