# manhunt 2 uncut hybrid

this is the us ps2 release of manhunt 2 with the cut stuff from the pal beta put back in. no execution filter, no camera shake, heads come off, and a bunch of cut characters, weapons, kills and dialogue are back where they belong.

it's a beta. most of it has been played and works, some of it hasn't been touched by anyone yet (list is at the bottom). if something breaks, tell me.

---

## what you need

your own **unmodified us copy** of manhunt 2 for ps2 (SLUS-21613) as an .iso:

| check | value |
|---|---|
| size | 2,657,058,816 bytes |
| crc32 | `8f57c95b` |
| md5 | `edb70f8fb513588df559e3b117b31f91` |
| sha-1 | `c5c1c775831fe8614189bee80064e4fc324e9ec1` |

pal, already-modded, or some other dump won't work. the patcher checks this for you so you don't end up with a broken game.

## how to patch (nothing to install)

1. open **`Manhunt 2 Uncut Patcher.html`** in your browser. chrome, edge, firefox or safari on windows / mac / linux, or chrome on android. it runs offline and nothing gets uploaded anywhere.
2. pick your clean us iso, then pick **`Manhunt 2 Uncut Hybrid.xdelta`**. both should get a green check.
3. hit **patch** and save it as **`SLUS_216.13.MANHUNT 2.iso`** (2.93 GB). keep that exact name, opl on a real ps2 needs it.

safari note: it can sit on "finishing download" for a bit with a 3 gb file. give it time, or use chrome/edge which write the file straight to disk.

already got an xdelta tool? the .xdelta is a normal patch, so delta patcher, xdelta ui, unipatcher (android) or `xdelta3 -d -s clean.iso patch.xdelta out.iso` all work too. iphone / ipad: patch on a computer and copy the iso over.

## how to play

- **pcsx2 / armsx2:** add the patched iso to your list and boot it. if you're replacing an older version, fully close the emulator first. use memory card saves, not save states (save states drag old level data back in).
- **real ps2 (opl):** drop `SLUS_216.13.MANHUNT 2.iso` in the DVD folder on your usb / smb / hdd. on usb, defrag the drive after copying. heads up: this has only been played on emulators so far, real hardware reports are very welcome.

---

## what's changed

### gore and executions
- **execution filter is gone** and **no camera shake** on kills. you actually see them now.
- **head gore works:** head explosions and decapitations show up instead of being cut away.
- **gunshot blood** uses the proper blood effect again.
- **dentist chair:** the hand drill to the face is back (the release skips that whole chunk).
- **katana:** the beta's level 2 and level 4 executions, and level 4 takes the head off again.
- **beta versions** of the hacksaw jump, crowbar jump, toilet, oil barrel, liquid nitrogen and mangler executions. the release changed the actual animations on these, so they're swapped back to the beta ones (with beta camera / sound where those differ).
- every other execution keeps the **release camera**. i tested the beta cameras and they made the models skip mid-kill, so they stay retail.

### cut weapons, back in the game
- **pliers** (with their beta executions)
- **dildo** in safe house, at the spot the beta had it
- **milk bottle** and **newspaper** in domestic disturbance. the beta never actually placed these anywhere, so they sit next to the hedge trimmer and the pliers. the milk bottle has its hud icon.
- **fire axe** back in personality clash and the tv studio (broadcast), at the beta's spots. it chops heads off corpses too.

### environmental kills
- **picket fence** (domestic disturbance) and **vending machine** (safe house), both at their beta positions with their own kill animations.

### cut characters / innocents
- **asylum:** the dying inmate in the cells (you can lock on and fight him now), beast2, and the first execution plays like the beta (beta voice lines, no danny vomiting). danny's "i won't fight" tutorial lock is gone too, so he'll attack whenever you want.
- **sexual deviants:** the stripper is a real dancing character again instead of a prop, with the beta bar scenes (sneak up, get spotted, the music cutting out, the stage door). plus the disco flashback dancers.
- **most wanted:** daddy and his kid scene.
- **safe house:** the three tramps (with heads, and head gore works on them).
- **red light:** trigby, the surprise bum, the street peds, and the toms vs bums stuff.

### dialogue
- censored and deleted lines put back across most levels (asylum, the old house, sexual deviants, most wanted, and more), including leo's taunts in personality clash and the leo scene in the tv studio. a few lines stay as they are: ones the beta only had as text with no recording, and ones that were already cut in the beta too.

### extras
- **level-complete stats screen**: time, hunters killed, executions, environmental executions, plus **style points**.
- **beta loading screens.**
- **release therapy** (the bonus level) is gated like the beta: you need to average more than 3 out of 5 style points across the levels before it unlocks.
- a few asylum triggers that were left dead in the release work again (cell sounds, the truck, a jump scare).

### stuff i kept from the release on purpose
- **all cutscenes.** the beta ones are earlier drafts (older models, worse lighting), not uncensored versions, and the release ones often have more blood anyway.
- the release asylum intro (more dialogue than the beta's).

---

## known issues

- vending machine kill: the cans / rope props are invisible.
- **nobody has played these yet**, so tell me how they go: daddy (most wanted), most of the red light characters, the disco flashback dancers, most of the restored dialogue, the picket fence and vending machine kills in their own levels, katana level 2, hacksaw / crowbar jump kills, toilet, oil barrel, liquid nitrogen, mangler.

## reporting bugs

tell me the level, what you were doing and what happened. if the game freezes, send the emulator log too:

- **pcsx2:** `emulog.txt` in the `logs` folder of your pcsx2 user folder
- **armsx2 (mac):** `~/Library/Application Support/ARMSX2/logs/emulog.txt`

---

## legal stuff

- this is a fan project. it's not affiliated with, endorsed by or connected to rockstar games or take-two interactive in any way.
- manhunt 2 and all of its content (models, animations, audio, text, the beta assets this restores) belong to their owners. no game is included here. you need your own legally obtained copy and you patch it yourself.
- the patch only carries what's needed to turn the us release into this build. no isos are hosted or linked here, so please don't ask for them.
- this is free and always will be. no donations, no ads, nothing sold.
- if you're a rights holder and want this taken down, open an issue or contact me and it'll come down.
- the patcher page code is under the mit license (see `LICENSE`). that license covers my code only, not any of the game data in the patch.
