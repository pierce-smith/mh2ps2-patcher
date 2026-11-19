#!/usr/bin/env python3
"""md2txt.py <README.md> <README.txt>: plain-text copy of the readme (for phones / notepad)."""
import re, sys, textwrap
src, dst = sys.argv[1:]
out = []
lines = open(src, encoding="utf-8").read().split("\n")
delim = lambda l: l.startswith("|") and all(re.fullmatch(r":?-*:?", c.strip()) for c in l.strip().strip("|").split("|"))
for i, line in enumerate(lines):
    if line.startswith("|") and i + 1 < len(lines) and delim(lines[i + 1]):
        continue                      # table header row: skip in the plain-text copy
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", line).replace("`", "")
    if s.strip() == "---":
        out.append(""); continue
    if s.startswith("|"):
        cells = [c.strip() for c in s.strip("|").split("|")]
        if all(re.fullmatch(r":?-*:?", c) for c in cells) or not any(cells):
            continue
        out.append(f"    {cells[0]:<8} {cells[1]}"); continue
    m = re.match(r"(#+) (.*)", s)
    if m:
        t = m.group(2).upper() if len(m.group(1)) <= 2 else m.group(2)
        out += ["", t, ("=" if len(m.group(1)) == 1 else "-") * len(t)]; continue
    m = re.match(r"(\s*)(- |\d+\. )(.*)", s)
    if m:
        ind, mark, body = m.groups()
        out += textwrap.wrap(body, 98, initial_indent=ind + mark, subsequent_indent=ind + " " * len(mark)); continue
    out += textwrap.wrap(s, 100) if s.strip() else [""]
txt = re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip() + "\n"
open(dst, "w", encoding="utf-8", newline="\r\n").write(txt)
