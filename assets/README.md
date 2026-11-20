# assets/

This folder holds the meme image: `gta6-meme-final.png` (1200×1400 PNG).

## Why the PNG is not in this commit yet

The snapshot push tool used to upload files to GitHub only carries UTF-8
text files — it cannot push binary files like a PNG. So the image is **not**
in the repo until a human adds it.

## How to add it (owner, 1 minute, from the browser)

1. Open the repo on GitHub: https://github.com/bangenets/gta6-meme-makefun
2. Open this `assets/` folder (create it first if the first push has no
   `assets/` folder yet: use "Add file → Create new file", type
   `assets/.gitkeep`, commit).
3. Click **Add file → Upload files**, drag in `gta6-meme-final.png`
   (the file is at `~/workspace/bounty-batch-8/konten/gta6-meme-final.png`,
   1200×1400, SHA-256 `cc2b971bd9f6e5dec1ae041d2f3c22fd79d5af3509b9b8a3d53a51a1ed348829`).
4. Commit directly to `main`.

After that, run `node main.ts` again — the "Meme image present" check
should turn PASS. Do not rename the file: `main.ts` and
`meme-manifest.json` both expect exactly `assets/gta6-meme-final.png`.
