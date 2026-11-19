# patcher source

everything used to make the patch and the patcher page. stdlib python 3 + node, nothing to install.

| file | what it does |
|---|---|
| `make_vcdiff.py` | makes the `.xdelta` (standard vcdiff / xdelta3 format) from the clean us iso and the finished build. matches 2048-byte sectors, so unchanged and moved files become copies. |
| `core.js` | the decoder the patcher page uses. reads the patch without loading 3 gb into memory, plus crc32 checks. |
| `patcher_template.html` | the patcher page. `build_release.py` drops `core.js` and the expected sizes / checksums into it. |
| `build_release.py` | builds `Manhunt 2 Uncut Patcher.html` (+ copies the patch) into an output folder. |
| `test_node.js` | applies the patch with `core.js` under node and writes the result, for checking it byte-for-byte. |
| `md2txt.py` | turns `README.md` into the plain-text `README.txt`. |

## rebuilding

```sh
python3 src/make_vcdiff.py "Manhunt 2 (USA).iso" "SLUS_216.13.MANHUNT 2 UNCUT.iso" "Manhunt 2 Uncut Hybrid.xdelta"
python3 src/build_release.py "Manhunt 2 (USA).iso" "SLUS_216.13.MANHUNT 2 UNCUT.iso" "Manhunt 2 Uncut Hybrid.xdelta" .
node src/test_node.js "Manhunt 2 (USA).iso" "Manhunt 2 Uncut Hybrid.xdelta" patched.iso   # then compare patched.iso to the build
python3 src/md2txt.py README.md README.txt
```
