import { readFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { buildFamilyCompletion } from "../src/family-completion.mjs";
import { writeJsonAtomic } from "../src/io.mjs";

const root = path.resolve(process.argv[2] ?? ".");
const lines = (text) => text.split(/\r?\n/).filter(Boolean).map(JSON.parse);
const json = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const queues = [];
const ownerRoot = path.join(root, "artifacts/corpus/owners");
for (const familyId of (await readdir(ownerRoot)).sort()) queues.push(await json(`artifacts/corpus/owners/${familyId}/queue.json`));
const result = buildFamilyCompletion({
  owners: lines(await readFile(path.join(root, "artifacts/corpus/ownership.jsonl"), "utf8")),
  queues,
  reviews: lines(await readFile(path.join(root, "artifacts/corpus/review-evidence.jsonl"), "utf8")),
  clusters: lines(await readFile(path.join(root, "artifacts/corpus/cluster-evidence.jsonl"), "utf8")),
  syntheses: await Promise.all((await readdir(path.join(root, "syntheses"))).filter((file) => file.endsWith(".json")).sort().map((file) => json(`syntheses/${file}`))),
  secondOrderPlan: await json("data/second-order-promotion-plan.v1.json").catch(() => null),
});
await mkdir(path.join(root, "receipts/families"), { recursive: true });
for (const family of result.families) await writeJsonAtomic(path.join(root, "receipts/families", `${family.familyId}.json`), family);
console.log(JSON.stringify({ familyCount: result.familyCount }, null, 2));
