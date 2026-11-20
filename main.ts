/**
 * GTA 6 meme on X — make.fun bounty entry validator
 * Bounty: https://make.fun/bounty/gta6-meme-x-01
 * Deadline: Mon 23 Nov 2026 14:00 UTC (21:00 WIB) — $500, 50 places paid
 *
 * What this program does (honest scope):
 * It does NOT generate the meme image. The meme was made by an AI agent
 * (image generation + the real make.fun ghost mascot from the official
 * press kit, https://make.fun/press/) and lives at
 * assets/gta6-meme-final.png. This program VALIDATES the submission
 * package: the meme file, its manifest, the post text and POST.json —
 * and writes a machine-readable report to output/meme-report.json.
 *
 * Standard library only. No network. No dependencies.
 * Runs on Node.js 22.18+ (type stripping) or with tsx:
 *   node main.ts [--asset <path-to-png>]
 *   npx tsx main.ts [--asset <path-to-png>]
 *
 * Exit code 0 = every required check passed (package is ready to submit).
 * Exit code 1 = at least one required check failed (see the report).
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));

const MANIFEST_PATH = join(ROOT, "meme-manifest.json");
const POST_TEXT_PATH = join(ROOT, "post-text.txt");
const POST_JSON_PATH = join(ROOT, "POST.json");
const DEFAULT_ASSET_PATH = join(ROOT, "assets", "gta6-meme-final.png");
const OUTPUT_PATH = join(ROOT, "output", "meme-report.json");

const EXPECTED_WIDTH = 1200;
const EXPECTED_HEIGHT = 1400;

// PNG signature (8 bytes) + IHDR chunk layout:
// bytes 0-7 signature, 8-11 IHDR length, 12-15 "IHDR",
// 16-19 width (BE uint32), 20-23 height (BE uint32).
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

type CheckStatus = "pass" | "fail" | "warn";

interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

interface Report {
  bounty: string;
  bounty_url: string;
  generated_at_utc: string;
  node_version: string;
  checks: Check[];
  ready_to_submit: boolean;
}

function readPngDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (buf[i] !== PNG_SIGNATURE[i]) return null;
  }
  if (buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function main(): number {
  const checks: Check[] = [];

  // Optional override so the validator can be tested against a meme
  // file that lives elsewhere (the PNG is uploaded to the repo by hand,
  // see assets/README.md).
  const assetArg = process.argv.indexOf("--asset");
  const assetPath =
    assetArg >= 0 && process.argv[assetArg + 1]
      ? resolve(process.argv[assetArg + 1])
      : DEFAULT_ASSET_PATH;

  // --- 1. Manifest -------------------------------------------------------
  let manifest: Record<string, unknown> | null = null;
  if (!existsSync(MANIFEST_PATH)) {
    checks.push({ id: "manifest-exists", label: "meme-manifest.json exists", status: "fail", detail: "File missing from repo root." });
  } else {
    try {
      manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Record<string, unknown>;
      checks.push({ id: "manifest-exists", label: "meme-manifest.json exists and parses", status: "pass", detail: "Valid JSON." });
    } catch (err) {
      checks.push({ id: "manifest-exists", label: "meme-manifest.json exists and parses", status: "fail", detail: `Invalid JSON: ${(err as Error).message}` });
    }
  }

  // --- 2. Meme image ------------------------------------------------------
  if (!existsSync(assetPath)) {
    checks.push({
      id: "meme-asset",
      label: "Meme image present",
      status: "fail",
      detail: `Not found at ${assetPath}. Upload gta6-meme-final.png to assets/ via the GitHub web UI (see assets/README.md).`,
    });
  } else {
    const buf = readFileSync(assetPath);
    const size = statSync(assetPath).size;
    const dims = readPngDimensions(buf);
    if (!dims) {
      checks.push({ id: "meme-asset", label: "Meme image is a valid PNG", status: "fail", detail: "File is not a PNG (bad signature or IHDR)." });
    } else if (dims.width !== EXPECTED_WIDTH || dims.height !== EXPECTED_HEIGHT) {
      checks.push({
        id: "meme-asset",
        label: "Meme image dimensions",
        status: "fail",
        detail: `Expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}, got ${dims.width}x${dims.height}.`,
      });
    } else {
      checks.push({
        id: "meme-asset",
        label: "Meme image is a valid PNG",
        status: "pass",
        detail: `PNG ${dims.width}x${dims.height}, ${(size / 1024).toFixed(0)} KB.`,
      });
    }
    if (manifest && typeof manifest.sha256 === "string") {
      checks.push({
        id: "meme-sha256",
        label: "Manifest records the meme SHA-256",
        status: "pass",
        detail: `Recorded: ${String(manifest.sha256).slice(0, 16)}… (verify by hand after uploading: sha256sum assets/gta6-meme-final.png).`,
      });
    }
  }

  // --- 3. Required make.fun elements in the picture (from manifest) -------
  const requiredElements = ["ghost-mascot", "make.fun-name", "gta-6-theme"];
  if (manifest && Array.isArray(manifest.elements_in_picture)) {
    const present = manifest.elements_in_picture as string[];
    const missing = requiredElements.filter((e) => !present.includes(e));
    checks.push({
      id: "meme-elements",
      label: "Required elements in the picture",
      status: missing.length === 0 ? "pass" : "fail",
      detail:
        missing.length === 0
          ? "Ghost mascot + make.fun name + GTA 6 theme all declared in the manifest."
          : `Missing from manifest: ${missing.join(", ")}. A meme without make.fun in the picture ranks below every meme that has one.`,
    });
  } else {
    checks.push({ id: "meme-elements", label: "Required elements in the picture", status: "fail", detail: "Manifest has no elements_in_picture list." });
  }

  // --- 4. Post text --------------------------------------------------------
  if (!existsSync(POST_TEXT_PATH)) {
    checks.push({ id: "post-text", label: "post-text.txt exists", status: "fail", detail: "File missing from repo root." });
  } else {
    const text = readFileSync(POST_TEXT_PATH, "utf8");
    const hasMakefun = /make\.fun/i.test(text);
    const hasTag = /@makefunai/i.test(text);
    const hasBountyLink = text.includes("https://make.fun/bounty/gta6-meme-x-01");
    const hasPlayCodePlaceholder = text.includes("[PLAY CODE");
    const playCodeLine = text.split("\n").find((l) => l.toLowerCase().startsWith("play code:"));
    checks.push({
      id: "post-text",
      label: "Post text mentions make.fun / @makefunai + bounty link",
      status: hasMakefun && hasTag && hasBountyLink ? "pass" : "fail",
      detail: `make.fun: ${hasMakefun ? "yes" : "NO"}, @makefunai: ${hasTag ? "yes" : "NO"}, bounty link: ${hasBountyLink ? "yes" : "NO"}.`,
    });
    if (!playCodeLine) {
      checks.push({ id: "post-play-code", label: "Play code present in post text", status: "fail", detail: "No 'Play code:' line in post-text.txt." });
    } else if (hasPlayCodePlaceholder) {
      checks.push({
        id: "post-play-code",
        label: "Play code present in post text",
        status: "fail",
        detail: "Play code is still the [PLAY CODE] placeholder. Take the real per-account code from make.fun while logged in and replace it before posting. A post without a play code is refused.",
      });
    } else {
      checks.push({ id: "post-play-code", label: "Play code present in post text", status: "pass", detail: "A play code value is present (value not shown in this report)." });
    }
    if (text.length > 280) {
      checks.push({ id: "post-length", label: "Post text length", status: "warn", detail: `${text.length} characters — over 280, X may split or reject it. Shorten before posting.` });
    } else {
      checks.push({ id: "post-length", label: "Post text length", status: "pass", detail: `${text.length} characters.` });
    }
  }

  // --- 5. POST.json ---------------------------------------------------------
  if (!existsSync(POST_JSON_PATH)) {
    checks.push({ id: "post-json", label: "POST.json exists", status: "fail", detail: "File missing from repo root." });
  } else {
    try {
      const post = JSON.parse(readFileSync(POST_JSON_PATH, "utf8")) as Record<string, unknown>;
      const url = typeof post.url === "string" ? post.url : "";
      if (!url || url.includes("REPLACE_WITH")) {
        checks.push({
          id: "post-json",
          label: "POST.json names the real X post URL",
          status: "fail",
          detail: "URL is still a REPLACE_WITH placeholder. Post the meme on X first, copy the post link (Share → Copy link), put it in POST.json, commit, and submit again before the deadline.",
        });
      } else if (!/^https:\/\/x\.com\/[^/]+\/status\/\d+/.test(url)) {
        checks.push({ id: "post-json", label: "POST.json names the real X post URL", status: "fail", detail: `URL does not look like an X post link: ${url}` });
      } else {
        checks.push({ id: "post-json", label: "POST.json names the real X post URL", status: "pass", detail: "URL shape is a valid x.com post link." });
      }
    } catch (err) {
      checks.push({ id: "post-json", label: "POST.json exists and parses", status: "fail", detail: `Invalid JSON: ${(err as Error).message}` });
    }
  }

  // --- Report ---------------------------------------------------------------
  const failed = checks.filter((c) => c.status === "fail").length;
  const report: Report = {
    bounty: "Post a GTA 6 meme on X (gta6-meme-x-01)",
    bounty_url: "https://make.fun/bounty/gta6-meme-x-01",
    generated_at_utc: new Date().toISOString(),
    node_version: process.version,
    checks,
    ready_to_submit: failed === 0,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");

  for (const c of checks) {
    const mark = c.status === "pass" ? "PASS" : c.status === "warn" ? "WARN" : "FAIL";
    console.log(`[${mark}] ${c.label} — ${c.detail}`);
  }
  console.log(`\nReport: ${OUTPUT_PATH}`);
  if (failed === 0) {
    console.log("READY TO SUBMIT: all required checks passed.");
    return 0;
  }
  console.log(`NOT READY: ${failed} required check(s) failed. Fix them, re-run, and only then submit.`);
  return 1;
}

process.exitCode = main();
