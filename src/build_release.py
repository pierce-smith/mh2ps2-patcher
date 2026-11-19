#!/usr/bin/env python3
"""build_release.py <clean.iso> <uncut.iso> <patch.xdelta> <outdir>: fills patcher_template.html -> outdir"""
import os, sys, zlib, shutil
def crc(p):
    c = 0
    with open(p, "rb") as f:
        while True:
            b = f.read(1 << 24)
            if not b: return c & 0xFFFFFFFF
            c = zlib.crc32(b, c)
def gb(n): return f"{n / 2**30:.2f} GB ({n:,} bytes)"
def mb(n): return f"{n / 2**20:.1f} MB"
src, out, pat, d = sys.argv[1:]
os.makedirs(d, exist_ok=True)
here = os.path.dirname(os.path.abspath(__file__))
t = open(os.path.join(here, "patcher_template.html")).read()
core = open(os.path.join(here, "core.js")).read()
pname = os.path.basename(pat)
v = {"SRC_SIZE": str(os.path.getsize(src)), "SRC_SIZE_H": gb(os.path.getsize(src)), "SRC_CRC": "%08x" % crc(src),
     "PATCH_SIZE": str(os.path.getsize(pat)), "PATCH_SIZE_H": mb(os.path.getsize(pat)), "PATCH_CRC": "%08x" % crc(pat),
     "PATCH_NAME": pname, "OUT_SIZE": str(os.path.getsize(out)), "OUT_SIZE_H": gb(os.path.getsize(out)),
     "OUT_CRC": "%08x" % crc(out), "OUT_NAME": "SLUS_216.13.MANHUNT 2.iso", "CORE_JS": core}
for k, x in v.items(): t = t.replace("%%" + k + "%%", x)
assert "%%" not in t, "unfilled placeholder"
open(os.path.join(d, "Manhunt 2 Uncut Patcher.html"), "w").write(t)
if not os.path.exists(os.path.join(d, pname)) or not os.path.samefile(pat, os.path.join(d, pname)): shutil.copy(pat, os.path.join(d, pname))
for k in ("SRC_SIZE", "SRC_CRC", "PATCH_SIZE", "PATCH_CRC", "OUT_SIZE", "OUT_CRC"): print(k, v[k])
