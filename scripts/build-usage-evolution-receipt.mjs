import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(".");
execFileSync(process.execPath, [path.join(root, "scripts/build-usage-evolution-construction.mjs")], { cwd: root, stdio: "inherit" });
execFileSync(process.execPath, [path.join(root, "scripts/build-usage-evolution-evaluation.mjs")], { cwd: root, stdio: "inherit" });
console.log(JSON.stringify({ status: "built", constructionProcessSeparated: true }, null, 2));
