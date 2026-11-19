// node test_node.js <source.iso> <patch> <out.iso>  - applies the patch with the same core.js the web page uses
const fs = require("fs"); const M = require("./core.js");
(async () => {
  const [src, pat, outp] = process.argv.slice(2);
  const S = await fs.openAsBlob(src), P = await fs.openAsBlob(pat);
  let t = Date.now();
  console.log("source crc32", (await M.crcBlob(S)).toString(16), (Date.now() - t) / 1000, "s");
  t = Date.now(); const { parts, size } = await M.plan(S, P);
  console.log("plan:", parts.length, "parts,", size, "bytes,", (Date.now() - t) / 1000, "s");
  t = Date.now(); console.log("output crc32 (from plan)", (await M.crcPlan(parts, size)).toString(16), (Date.now() - t) / 1000, "s");
  const out = fs.openSync(outp, "w");
  for (const p of parts) {
    if (p.u) fs.writeSync(out, p.u);
    else for (let s = p.s; s < p.e; s += 1 << 24) fs.writeSync(out, new Uint8Array(await p.b.slice(s, Math.min(p.e, s + (1 << 24))).arrayBuffer()));
  }
  fs.closeSync(out); console.log("written", outp);
})().catch(e => { console.error("FAIL", e); process.exit(1); });
