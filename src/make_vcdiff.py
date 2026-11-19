#!/usr/bin/env python3
"""Standard VCDIFF (RFC 3284, xdelta3-compatible) patch encoder, stdlib only.
usage: make_vcdiff.py <source.iso> <target.iso> <out.xdelta>

ISO-oriented: matches 2048-byte sectors of the target against the source (same position first, then any
position via a hash index), so unchanged and moved files become COPYs and everything else ADDs.
Only two default-code-table instructions are emitted: ADD (index 1, explicit size) and COPY mode 0 / VCD_SELF
(index 19, explicit size, absolute address). Each window carries the xdelta3 VCD_ADLER32 checksum.
No secondary compression, no application header -> readable by xdelta3, Delta Patcher, xdelta UI, UniPatcher,
Rom Patcher JS and the bundled web patcher."""
import hashlib, os, sys, zlib

SEC = 2048
WIN = 1 << 23           # target window size (8 MB, well under xdelta3's 16 MB hard limit)
MAX_SPAN = 1 << 26      # max source segment span per window (64 MB)


def varint(n):
    out = [n & 0x7F]; n >>= 7
    while n:
        out.append(0x80 | (n & 0x7F)); n >>= 7
    return bytes(reversed(out))


def h(b):
    return hashlib.blake2b(b, digest_size=8).digest()


def main(src_p, tgt_p, out_p):
    ssz, tsz = os.path.getsize(src_p), os.path.getsize(tgt_p)
    print(f"indexing source ({ssz} bytes)...", flush=True)
    index = {}
    with open(src_p, "rb") as f:
        off = 0
        while True:
            b = f.read(SEC * 4096)
            if not b:
                break
            for i in range(0, len(b) - SEC + 1, SEC):
                index.setdefault(h(b[i:i + SEC]), off + i)
            off += len(b)
    print(f"  {len(index)} distinct sectors", flush=True)

    src = open(src_p, "rb"); tgt = open(tgt_p, "rb"); out = open(out_p, "wb")
    out.write(b"\xd6\xc3\xc4\x00\x00")           # magic + version 0, Hdr_Indicator 0
    pos = 0; n_add = n_copy = 0; wins = 0
    while pos < tsz:
        tw = tgt.read(min(WIN, tsz - pos))
        # build instruction list: (kind, length, src_addr|data_off)
        ops = []; lo = hi = None; i = 0
        while i < len(tw):
            blk = tw[i:i + SEC]; s = None
            if len(blk) == SEC:
                if ops and ops[-1][0] == "C":           # try to extend the previous COPY
                    cand = ops[-1][2] + ops[-1][1]
                    src.seek(cand)
                    if src.read(SEC) == blk:
                        s = cand
                if s is None and pos + i + SEC <= ssz:   # same position
                    src.seek(pos + i)
                    if src.read(SEC) == blk:
                        s = pos + i
                if s is None:
                    c = index.get(h(blk))
                    if c is not None:
                        src.seek(c)
                        if src.read(SEC) == blk:
                            s = c
            if s is not None:
                nlo = s if lo is None else min(lo, s); nhi = s + SEC if hi is None else max(hi, s + SEC)
                if nhi - nlo > MAX_SPAN:                  # keep the source segment bounded: end window here
                    break
                lo, hi = nlo, nhi
                if ops and ops[-1][0] == "C" and ops[-1][2] + ops[-1][1] == s:
                    ops[-1] = ("C", ops[-1][1] + SEC, ops[-1][2])
                else:
                    ops.append(("C", SEC, s))
            else:
                if ops and ops[-1][0] == "A":
                    ops[-1] = ("A", ops[-1][1] + len(blk), ops[-1][2])
                else:
                    ops.append(("A", len(blk), i))
            i += len(blk)
        tw = tw[:i]
        if i < WIN and pos + i < tsz:
            tgt.seek(pos + i)                             # window ended early (span limit)
        data = bytearray(); inst = bytearray(); addr = bytearray()
        for k, ln, a in ops:
            if k == "A":
                inst += b"\x01" + varint(ln); data += tw[a:a + ln]; n_add += ln
            else:
                inst += b"\x13" + varint(ln); addr += varint(a - lo); n_copy += ln
        body = (varint(len(tw)) + b"\x00" + varint(len(data)) + varint(len(inst)) + varint(len(addr))
                + (zlib.adler32(tw) & 0xFFFFFFFF).to_bytes(4, "big") + bytes(data) + bytes(inst) + bytes(addr))
        if lo is not None:
            out.write(b"\x05" + varint(hi - lo) + varint(lo))   # VCD_SOURCE | VCD_ADLER32
        else:
            out.write(b"\x04")                                  # VCD_ADLER32 only
        out.write(varint(len(body)) + body)
        pos += len(tw); wins += 1
        if wins % 50 == 0:
            print(f"  {pos * 100 // tsz}%  copied {n_copy >> 20} MB, new data {n_add >> 20} MB", flush=True)
    out.close()
    print(f"done: {wins} windows, copied {n_copy} bytes, new data {n_add} bytes, patch {os.path.getsize(out_p)} bytes")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
