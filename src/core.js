/* MH2 patcher core: streaming VCDIFF (RFC 3284 / xdelta3) decoder + CRC32.
   Works on Blobs (browser File, or Node fs.openAsBlob). Instead of producing bytes it produces a "plan":
   a list of parts {b: Blob, s, e} (slices of the source ISO or of the patch's ADD data) or {u: Uint8Array},
   so the 3 GB output never has to sit in memory. */
(function (root) {
  "use strict";

  // ---------- CRC32 ----------
  const T = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  function crcUpdate(crc, u8) {
    let c = ~crc;
    for (let i = 0; i < u8.length; i++) c = T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return ~c >>> 0;
  }
  async function readU8(blob, s, e) { return new Uint8Array(await blob.slice(s, e).arrayBuffer()); }
  async function crcBlob(blob, onProgress, chunk = 1 << 24) {
    let crc = 0;
    for (let p = 0; p < blob.size; p += chunk) {
      crc = crcUpdate(crc, await readU8(blob, p, Math.min(blob.size, p + chunk)));
      if (onProgress) onProgress(Math.min(blob.size, p + chunk) / blob.size);
    }
    return crc >>> 0;
  }
  // CRC over a plan (the patched output) without materializing it
  async function crcPlan(parts, total, onProgress, chunk = 1 << 24) {
    let crc = 0, done = 0;
    for (const p of parts) {
      if (p.u) { crc = crcUpdate(crc, p.u); done += p.u.length; }
      else for (let s = p.s; s < p.e; s += chunk) {
        const e = Math.min(p.e, s + chunk);
        crc = crcUpdate(crc, await readU8(p.b, s, e)); done += e - s;
        if (onProgress) onProgress(done / total);
      }
    }
    return crc >>> 0;
  }

  // ---------- default code table (RFC 3284 5.6) ----------
  const NOOP = 0, ADD = 1, RUN = 2, COPY = 3;
  const TABLE = [];
  TABLE.push([RUN, 0, 0, NOOP, 0, 0]);
  for (let s = 0; s <= 17; s++) TABLE.push([ADD, s, 0, NOOP, 0, 0]);
  for (let m = 0; m <= 8; m++) {
    TABLE.push([COPY, 0, m, NOOP, 0, 0]);
    for (let s = 4; s <= 18; s++) TABLE.push([COPY, s, m, NOOP, 0, 0]);
  }
  for (let m = 0; m <= 5; m++) for (let a = 1; a <= 4; a++) for (let c = 4; c <= 6; c++) TABLE.push([ADD, a, 0, COPY, c, m]);
  for (let m = 6; m <= 8; m++) for (let a = 1; a <= 4; a++) TABLE.push([ADD, a, 0, COPY, 4, m]);
  for (let m = 0; m <= 8; m++) TABLE.push([COPY, 4, m, ADD, 1, 0]);
  if (TABLE.length !== 256) throw new Error("code table");

  class Reader {               // cursor over a Uint8Array
    constructor(u8, pos = 0) { this.u = u8; this.p = pos; }
    byte() { if (this.p >= this.u.length) throw new Error("patch truncated"); return this.u[this.p++]; }
    varint() { let v = 0, b; do { b = this.byte(); v = v * 128 + (b & 0x7F); } while (b & 0x80); return v; }
  }

  // Build the output plan. src, patch: Blobs.
  async function plan(src, patch, onProgress) {
    const parts = [];
    let head = await readU8(patch, 0, Math.min(patch.size, 1 << 16));
    let r = new Reader(head);
    if (r.byte() !== 0xD6 || r.byte() !== 0xC3 || r.byte() !== 0xC4) throw new Error("not an xdelta/VCDIFF patch");
    r.byte();                                   // version
    const hdr = r.byte();
    if (hdr & 0x01) throw new Error("patch uses secondary compression (re-create it with xdelta3 -S none)");
    if (hdr & 0x02) throw new Error("patch uses a custom code table (unsupported)");
    if (hdr & 0x04) { const n = r.varint(); r.p += n; }   // application header (file names) - skip
    let off = r.p, total = 0;
    while (off < patch.size) {
      // window header: at most ~40 bytes before the sections
      r = new Reader(await readU8(patch, off, Math.min(patch.size, off + 64)));
      const wi = r.byte();
      if (wi & 0x02) throw new Error("VCD_TARGET windows are not supported");
      let segLen = 0, segPos = 0;
      if (wi & 0x01) { segLen = r.varint(); segPos = r.varint(); }
      const encLen = r.varint(), encStart = r.p;
      const winLen = r.varint();
      const di = r.byte(); if (di) throw new Error("compressed delta sections are not supported");
      const dataLen = r.varint(), instLen = r.varint(), addrLen = r.varint();
      if (wi & 0x04) r.p += 4;                  // adler32 (output is verified by CRC32 instead)
      const dataOff = off + r.p;
      const ia = await readU8(patch, dataOff + dataLen, dataOff + dataLen + instLen + addrLen);
      const inst = new Reader(ia.subarray(0, instLen)), addr = new Reader(ia.subarray(instLen));
      const near = [0, 0, 0, 0], same = new Array(768).fill(0); let nextNear = 0;
      let dataCur = 0, tpos = 0;               // tpos = bytes produced in this window
      let win = [];                            // parts of this window
      let mat = null;                          // materialized window bytes (only after a target-copy)
      const pushPart = (p) => {
        if (mat) {                             // window already materialized: append bytes
          throw new Error("internal: pushPart after materialize");
        }
        const last = win[win.length - 1];
        if (last && !last.u && !p.u && last.b === p.b && last.e === p.s) last.e = p.e; else win.push(p);
      };
      const materialize = async () => {        // window -> one Uint8Array (needed for target self-copies)
        const buf = new Uint8Array(winLen); let o = 0;
        for (const p of win) { const u = p.u || await readU8(p.b, p.s, p.e); buf.set(u, o); o += u.length; }
        mat = buf; win = [];
      };
      const decodeAddr = (mode, here) => {
        let a;
        if (mode === 0) a = addr.varint();
        else if (mode === 1) a = here - addr.varint();
        else if (mode <= 5) a = near[mode - 2] + addr.varint();
        else a = same[(mode - 6) * 256 + addr.byte()];
        near[nextNear] = a; nextNear = (nextNear + 1) % 4; same[a % 768] = a;
        return a;
      };
      const exec = async (type, size, mode) => {
        if (type === NOOP) return;
        if (size === 0) size = inst.varint();
        if (type === ADD) {
          if (mat) { mat.set(await readU8(patch, dataOff + dataCur, dataOff + dataCur + size), tpos); }
          else pushPart({ b: patch, s: dataOff + dataCur, e: dataOff + dataCur + size });
          dataCur += size;
        } else if (type === RUN) {
          const byte = (await readU8(patch, dataOff + dataCur, dataOff + dataCur + 1))[0]; dataCur += 1;
          if (mat) mat.fill(byte, tpos, tpos + size); else pushPart({ u: new Uint8Array(size).fill(byte) });
        } else {
          const a = decodeAddr(mode, segLen + tpos);
          if (a < segLen) {
            if (a + size > segLen) throw new Error("copy crosses source segment");
            if (mat) mat.set(await readU8(src, segPos + a, segPos + a + size), tpos);
            else pushPart({ b: src, s: segPos + a, e: segPos + a + size });
          } else {
            if (!mat) await materialize();
            const t0 = a - segLen;
            for (let i = 0; i < size; i++) mat[tpos + i] = mat[t0 + i];   // may overlap (byte-wise, per RFC)
          }
        }
        tpos += size;
      };
      while (inst.p < inst.u.length) {
        const [t1, s1, m1, t2, s2, m2] = TABLE[inst.byte()];
        await exec(t1, s1, m1); await exec(t2, s2, m2);
      }
      if (tpos !== winLen) throw new Error(`window size mismatch (${tpos} != ${winLen})`);
      if (mat) parts.push({ u: mat }); else for (const p of win) {
        const last = parts[parts.length - 1];
        if (last && !last.u && !p.u && last.b === p.b && last.e === p.s) last.e = p.e; else parts.push(p);
      }
      total += winLen;
      off = off + encStart + encLen;          // encStart is relative to this window's header read
      if (onProgress) onProgress(off / patch.size);
    }
    return { parts, size: total };
  }

  const api = { crcUpdate, crcBlob, crcPlan, plan };
  root.MH2Patch = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
