// Extracts every literal t(locale, ig, en) call from the client and emits the
// default bilingual content catalogue. Re-run after editing copy in App.tsx.
//
//   node script/generate-content.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(root, "src/client/App.tsx");
const dest = path.join(root, "src/shared/site-content.generated.ts");
const app = fs.readFileSync(appPath, "utf8");

const unescape = (value) => value.replace(/\\(['"\\])/g, "$1");

const funcs = [];
const funcRe = /function\s+([A-Za-z0-9_]+)\s*\(/g;
let fm;
while ((fm = funcRe.exec(app) ?? null)) funcs.push({ name: fm[1], at: fm.index });

const call = /\bt\(\s*locale\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g;
const seen = new Set();
const out = [];
let m;
while ((m = call.exec(app))) {
  const ig = unescape(m[1]);
  const en = unescape(m[2]);
  if (!en || !ig || seen.has(en)) continue;
  seen.add(en);
  let group = "General";
  for (const fn of funcs) {
    if (fn.at < m.index) group = fn.name;
    else break;
  }
  const id = crypto.createHash("sha1").update(en).digest("hex").slice(0, 10);
  out.push({ id, group, source: en, en, ig });
}

const lines = out.map(
  (o) =>
    `  { id: ${JSON.stringify(o.id)}, group: ${JSON.stringify(o.group)}, source: ${JSON.stringify(o.source)}, en: ${JSON.stringify(o.en)}, ig: ${JSON.stringify(o.ig)} },`,
);

const header = [
  "// AUTO-GENERATED from src/client/App.tsx t(locale, ig, en) calls.",
  "// Re-run script/generate-content.mjs after changing copy.",
  'import type { SiteContentField } from "./site-content";',
  "",
  "export const scalarContentDefaults: SiteContentField[] = [",
].join("\n");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, `${header}\n${lines.join("\n")}\n];\n`);
console.log(`wrote ${appPath} -> ${dest} (${app.length} chars scanned)`);
