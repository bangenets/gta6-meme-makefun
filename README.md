# GTA 6 meme on X — make.fun bounty entry

Entry for the make.fun bounty **"Post a GTA 6 meme on X"**
(https://make.fun/bounty/gta6-meme-x-01) — $500, 50 places paid.
Deadline: **Mon 23 Nov 2026, 14:00 UTC (21:00 WIB)**.

## The meme

Vice City sunset. One man shows his phone, the other counts real cash.
Top text: *"HE SPENT 400 HOURS ROBBING BANKS IN GTA 6"*.
Bottom text: *"MY AGENT DID IT ON MAKE.FUN AND GOT PAID REAL USDC"*.
The real make.fun ghost mascot (official press kit, not redrawn) sits in the
top-right corner, and MAKE.FUN is in the bottom text.

The image file is `assets/gta6-meme-final.png` (1200×1400 PNG).
It is **not in this commit yet** — see `assets/README.md`: the PNG must be
uploaded via the GitHub web UI, because the snapshot push tool cannot carry
binary files.

## What's in this repo

| File | What it is |
|---|---|
| `main.ts` | Node 22 validator (stdlib only, no network). Validates the meme file, manifest, post text and POST.json; writes `output/meme-report.json`. It does **not** generate the image. |
| `meme-manifest.json` | Description of the meme: texts, dimensions, SHA-256, required elements. |
| `post-text.txt` | The exact X post text (play code still a placeholder — see below). |
| `POST.json` | `{"url": "…"}` — the X post address. Template for now; fill in after posting. |
| `TRANSCRIPT.md` | Honest summary of the sessions that made this entry. Not a verbatim harness log — the official bundle is made with the kit CLI at submit time. |
| `assets/README.md` | How to add the PNG to the repo. |
| `LICENSE` | MIT. |

## How to run the validator

Requires Node.js 22.18 or later (22, 24, 26 all fine — no install step,
standard library only, no network):

```sh
node main.ts
# or
npx tsx main.ts
# test against a meme file that lives elsewhere:
node main.ts --asset /path/to/gta6-meme-final.png
```

Exit code `0` = every required check passed, the package is ready to submit.
Exit code `1` = something is still missing (the report says what).
The report lands in `output/meme-report.json`.

## Still needed from the owner (nothing here is faked)

1. **Play code** — your make.fun play code, unique per account, only visible
   when logged in to make.fun. Replace the `[PLAY CODE …]` placeholder in
   `post-text.txt`. A post without a play code is refused.
2. **Post on X** — from a **public** X account (not protected, stays public
   until results are out), before Mon 23 Nov 2026 21:00 WIB. Post the meme
   as the first picture with the text from `post-text.txt`.
3. **POST.json** — copy the post link (Share → Copy link) into `POST.json`,
   commit, and submit again before the deadline.
4. **The PNG** — upload `gta6-meme-final.png` into `assets/` via the GitHub
   web UI (drag & drop). See `assets/README.md`.
5. **Transcript bundle** — at submit time, make the official bundle with the
   kit CLI (`node cli/makefun.mjs bundle`) from the real session logs.

## Rules this entry follows

- Meme about GTA 6, launch week. Picture shows make.fun (ghost mascot +
  name). Post carries make.fun + @makefunai + play code.
- Repo is public, owned by the entrant's own GitHub account, MIT licensed,
  `main.ts` (Node 22) at the root, `POST.json` at the root.
- Max 5 submissions a day, 10 total; the last submission before the deadline
  is the final entry.
