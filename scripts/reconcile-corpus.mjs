import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildCorpusReconciliation } from "../src/corpus-reconciliation.mjs";

const repositoryRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

function parseArgs(argv) {
  const parsed = {
    repositoryRoot,
    outputPath: path.join(repositoryRoot, "data", "corpus-reconciliation-v1"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") {
      if (argv[index + 1] === undefined) throw new Error("--root requires a path");
      parsed.repositoryRoot = path.resolve(argv[++index]);
    } else if (argument === "--output") {
      if (argv[index + 1] === undefined) throw new Error("--output requires a path");
      parsed.outputPath = argv[++index];
    } else if (argument === "--help" || argument === "-h") {
      parsed.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!path.isAbsolute(parsed.outputPath)) {
    parsed.outputPath = path.resolve(parsed.repositoryRoot, parsed.outputPath);
  }
  return parsed;
}

export async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log("Usage: node scripts/reconcile-corpus.mjs [--root PATH] [--output PATH]");
    return null;
  }
  const result = await buildCorpusReconciliation(args);
  console.log(JSON.stringify({
    outputPath: result.outputPath,
    manifestSha256: result.manifestSha256,
    inputFileCount: result.inputs.length,
    excludedInputCount: result.exclusions.length,
    counts: result.counts,
  }, null, 2));
  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await run();
