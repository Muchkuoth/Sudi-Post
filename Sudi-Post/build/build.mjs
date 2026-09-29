#!/usr/bin/env node
/* ==========================================================================
   SUDI-POST — Static site build
   --------------------------------------------------------------------------
   Assembles build/pages/*.html into fully static HTML at the project root
   using build/layout.html + build/partials/*.html.

   Each page file starts with a meta block:
     <!--meta
     { "title": "...", "desc": "...", "out": "about.html",
       "scripts": ["assets/js/about.js"], "head": "..." }
     meta-->

   Usage:  node build/build.mjs           build all pages
           node build/build.mjs --check   validate links only (no write)
   ========================================================================== */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PAGES_DIR = join(ROOT, "build", "pages");
const PARTIALS_DIR = join(ROOT, "build", "partials");

const SITE = "https://www.sudipost.com/";
const checkOnly = process.argv.includes("--check");

const read = (p) => readFileSync(p, "utf8");

/* ---------------------------------------------------------------- meta --- */
function extractMeta(src) {
  const m = src.match(/<!--meta\s*([\s\S]*?)meta-->/);
  if (!m) throw new Error("Missing <!--meta {...} meta--> block");
  const cfg = JSON.parse(m[1]);
  let body = src.replace(m[0], "").trim();
  /* hoist JSON-LD blocks from the body into the document head */
  const ld = [];
  body = body.replace(/[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, (block) => {
    ld.push(block.trim());
    return "";
  });
  return { cfg, body, ld };
}

/* --------------------------------------------------------------- build --- */
const layout = read(join(ROOT, "build", "layout.html"));
const header = read(join(PAGES_DIR, "..", "partials", "header.html")).trim();
const footer = read(join(PAGES_DIR, "..", "partials", "footer.html")).trim();

const files = readdirSync(PAGES_DIR).filter((f) => f.endsWith(".html"));
const outputs = [];
const manifest = [];

for (const file of files) {
  const raw = read(join(PAGES_DIR, file));
  const { cfg, body, ld } = extractMeta(raw);
  const out = cfg.out || file.replace(/^home$/, "index");

  const head = [cfg.head || "", ...ld].filter(Boolean).join("\n    ");

  /* "chrome": false omits the public header/footer — used by the app-shell
     portals (admin, driver) which provide their own full-screen navigation. */
  const useChrome = cfg.chrome !== false;

  /* app-shell portals are role-gated: keep them out of search indexes */
  const robots = useChrome ? "" : '<meta name="robots" content="noindex, nofollow">';

  const html = layout
    .replace(/\{\{TITLE\}\}/g, cfg.title)
    .replace(/\{\{DESC\}\}/g, cfg.desc)
    .replace(/\{\{CANONICAL\}\}/g, SITE + out)
    .replace(/\{\{HEAD\}\}/g, [robots, head].filter(Boolean).join("\n    "))
    .replace(/\{\{HEADER\}\}/g, useChrome ? header : "")
    .replace(/\{\{FOOTER\}\}/g, useChrome ? footer : "")
    .replace(/\{\{BODY\}\}/g, body)
    .replace(/\{\{SCRIPTS\}\}/g, (cfg.scripts || []).map((s) => `<script src="${s}"></script>`).join("\n"));

  outputs.push({ out, html });
  manifest.push({ out, title: cfg.title, desc: cfg.desc, scripts: cfg.scripts || [] });

  if (!checkOnly) writeFileSync(join(ROOT, out), html, "utf8");
}

if (!checkOnly) {
  console.log(`Built ${outputs.length} pages:`);
  outputs.forEach((o) => console.log("  + " + o.out));
}

/* ------------------------------------------------------------ validate --- */
const problems = [];
const known = new Set([...outputs.map((o) => o.out), "index.html"]);

/* Referenced by markup that falls back gracefully when the file is absent, so
   a missing file is a content gap rather than a broken build. */
const OPTIONAL_ASSETS = [];

for (const { out, html } of outputs) {
  const refs = html.match(/(?:href|src)="([^"]+)"/g) || [];
  for (const raw of refs) {
    const ref = raw.replace(/^(href|src)="/, "").replace(/"$/, "");
    if (!ref || ref.startsWith("#") || ref.startsWith("http") || ref.startsWith("mailto:") ||
        ref.startsWith("tel:") || ref.startsWith("data:") || ref.startsWith("{{")) continue;
    const file = ref.split("#")[0].split("?")[0];
    if (!file) continue;
    /* Optional assets are referenced by markup that degrades gracefully when
       they are absent, so their absence must not fail the build. */
    if (OPTIONAL_ASSETS.some((prefix) => file.startsWith(prefix))) continue;
    if (!existsSync(join(ROOT, file))) problems.push(`${out} → missing file: ${file}`);
  }
  // unbalanced tag smoke test
  const opens = (html.match(/<(section|div|main|article|form|table|ul|nav|header|footer)\b/g) || []).length;
  const closes = (html.match(/<\/(section|div|main|article|form|table|ul|nav|header|footer)>/g) || []).length;
  if (opens !== closes) problems.push(`${out} → unbalanced block tags (${opens} open / ${closes} close)`);
  if (!/lang="en"/.test(html)) problems.push(`${out} → missing lang attribute`);
  if (!/<title>[^<]{10,}<\/title>/.test(html)) problems.push(`${out} → weak or missing <title>`);
  if (!/name="description" content=".{40,}"/.test(html)) problems.push(`${out} → weak or missing meta description`);
  if (!/id="main"/.test(html)) problems.push(`${out} → missing #main landmark`);
  if (/undefined|NaN|\[object Object\]/.test(html)) problems.push(`${out} → contains undefined/NaN/[object Object]`);
}

// script files referenced must exist
for (const page of manifest) {
  for (const s of page.scripts) {
    if (!existsSync(join(ROOT, s))) problems.push(`${page.out} → missing script: ${s}`);
  }
}

if (problems.length) {
  console.error("\n✗ Validation problems:\n" + problems.map((p) => "  • " + p).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`\n✓ ${outputs.length} pages validated — links, landmarks, metadata and scripts all good.`);
}

writeFileSync(join(ROOT, "build", "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
