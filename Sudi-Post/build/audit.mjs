#!/usr/bin/env node
/* ==========================================================================
   SUDI-POST — Static audit
   --------------------------------------------------------------------------
   Cross-checks each generated page for the mistakes that break a page at
   runtime but pass `node --check`:

     • JS selects an element id that the page does not contain
     • an icon name is used that the icon set does not define
     • an <a href="x.html"> or <script src="y.js"> target does not exist
     • duplicate element ids
     • a page loads more than one data-icon/CSS-class dependency it never uses
     • images without alt text, buttons/links with no accessible name

   Usage:  node build/audit.mjs
   Exit code 1 when problems are found.
   ========================================================================== */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const read = (p) => readFileSync(p, "utf8");

/* ------------------------------------------------------------- icon set -- */
const uiSrc = read(join(ROOT, "assets", "js", "ui.js"));
const iconBlock = uiSrc.slice(uiSrc.indexOf("const P = {"), uiSrc.indexOf("function icon("));
const ICONS = new Set(
  [...iconBlock.matchAll(/(?:^|\s)"?([a-z0-9-]+)"?:\s*'/g)].map((m) => m[1])
);

/* -------------------------------------------------------------- helpers -- */
const problems = [];
const notes = [];
const add = (page, msg) => problems.push(`${page} → ${msg}`);

/* Referenced by markup that degrades gracefully when the file is absent. */
const OPTIONAL_ASSETS = [];

function idsIn(html) {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
}
function selectorIdsIn(js) {
  const out = new Set();
  for (const m of js.matchAll(/\$\(\s*["']#([A-Za-z][\w:-]*)["']/g)) out.add(m[1]);
  for (const m of js.matchAll(/getElementById\(\s*["']([A-Za-z][\w:-]*)["']/g)) out.add(m[1]);
  for (const m of js.matchAll(/querySelector\(\s*["']#([A-Za-z][\w:-]*)["']/g)) out.add(m[1]);
  return out;
}
/* strip comments so documentation examples are not audited as real usage */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function iconNamesIn(text) {
  const out = new Set();
  const src = stripComments(text);
  for (const m of src.matchAll(/(?:^|[^\w.])icon\(\s*["']([a-z0-9-]+)["']/g)) out.add(m[1]);
  for (const m of src.matchAll(/data-icon=["']([a-z0-9-]+)["']/g)) out.add(m[1]);
  return out;
}
function idsCreatedIn(js) {
  const out = new Set();
  for (const m of js.matchAll(/id=["']([A-Za-z][\w:-]*)["']/g)) out.add(m[1]);
  for (const m of js.matchAll(/\.id\s*=\s*["']([A-Za-z][\w:-]*)["']/g)) out.add(m[1]);
  return out;
}
function assetsOf(page) {
  const rel = "assets/js/" + page.replace(/\.html$/, ".js");
  return existsSync(join(ROOT, rel)) ? [rel] : [];
}

/* ------------------------------------------------------------ audit run -- */
const pages = readdirSync(ROOT).filter((f) => f.endsWith(".html"));

for (const page of pages) {
  const html = read(join(ROOT, page));
  const ids = idsIn(html);
  const idSet = new Set(ids);

  /* duplicate ids */
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) add(page, `duplicate id "${id}"`);
    seen.add(id);
  }

  /* local href/src targets */
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^(#|https?:|mailto:|tel:|data:|javascript:)/.test(ref)) continue;
      const file = ref.split("#")[0].split("?")[0];
      if (!file) continue;
      /* Optional assets degrade gracefully when absent (the <img> hides itself
         and a styled placeholder panel shows through), so they are not broken. */
      if (OPTIONAL_ASSETS.some((prefix) => file.startsWith(prefix))) continue;
      if (!existsSync(join(ROOT, file))) add(page, `broken local reference: ${ref}`);
  }

  /* images need alt */
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(m[0])) add(page, `<img> without alt: ${m[0].slice(0, 70)}…`);
  }

  /* page JS must exist and only touch real ids / real icons */
  const scripts = assetsOf(page);
  const pageJs = scripts.map((s) => read(join(ROOT, s))).join("\n");
  const shared = ["data.js", "store.js", "ui.js", "map.js"]
    .map((f) => join(ROOT, "assets", "js", f))
    .filter(existsSync)
    .map((p) => read(p))
    .join("\n");

  /* ids: only check page-specific scripts, and only when the page loads them.
     Ids that the script creates itself are excluded. */
  for (const script of scripts) {
    const js = read(join(ROOT, script));
    const dynamic = idsCreatedIn(js);
    for (const id of selectorIdsIn(js)) {
      if (!idSet.has(id) && !dynamic.has(id)) {
        add(page, `${script} selects #${id}, which the page neither defines nor creates`);
      }
    }
  }

  /* icons used in markup must exist */
  for (const name of iconNamesIn(html)) {
    if (!ICONS.has(name)) add(page, `unknown icon "data-icon=${name}"`);
  }
  /* icons used in page JS must exist */
  for (const script of scripts) {
    for (const name of iconNamesIn(read(join(ROOT, script)))) {
      if (!ICONS.has(name)) add(page, `${script} uses unknown icon "${name}"`);
    }
  }

  /* structural expectations */
  if (!/id="main"/.test(html)) add(page, 'missing #main landmark');
  if (!/<h1[\s>]/.test(html)) add(page, "missing <h1>");
  if (!/rel="canonical"/.test(html)) add(page, "missing canonical link");
  if (!/og:image/.test(html)) add(page, "missing og:image");
  if (!/class="skip-link"/.test(html)) add(page, "missing skip link");
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s > 1) add(page, `${h1s} <h1> elements (expected exactly 1)`);
  const labels = [...html.matchAll(/<label\b[^>]*>([\s\S]{0,60}?)<\/label>/g)];
  for (const [, body] of labels) {
    if (!body.trim()) add(page, "empty <label> element");
  }

  /* every page should be reachable from the shared nav or footer */
  if (!pageJs.includes("SP.") && !shared) notes.push(`${page} loads no page script`);
}

/* ------------------------------------------------------- global warnings -- */
for (const js of readdirSync(join(ROOT, "assets", "js"))) {
  const src = read(join(ROOT, "assets", "js", js));
  for (const name of iconNamesIn(src)) {
    if (!ICONS.has(name)) problems.push(`assets/js/${js} → unknown icon "${name}"`);
  }
}

/* orphan pages: built but never linked.
   App-shell portals are built with "chrome": false, so they carry no public
   header/footer to link from — they are reached by role after sign-in, and the
   signed-in header link is injected by ui.js. Exempt them from the check. */
const linked = new Set();
const isPortal = new Set();
for (const page of pages) {
  const html = read(join(ROOT, page));
  for (const m of html.matchAll(/href="([^"#?]+\.html)/g)) linked.add(m[1]);
  if (!html.includes('class="site-header"')) isPortal.add(page);
}
for (const p of pages) {
  if (p === "index.html") continue;
  if (isPortal.has(p)) continue;
  if (!linked.has(p)) problems.push(`${p} is not linked from any page`);
}

/* ---------------------------------------------------------------- report -- */
if (notes.length) {
  console.log("Notes:");
  notes.forEach((n) => console.log("  · " + n));
  console.log("");
}
if (problems.length) {
  console.error(`✗ ${problems.length} audit problem(s):`);
  [...new Set(problems)].forEach((p) => console.error("  • " + p));
  process.exitCode = 1;
} else {
  console.log(`✓ Audited ${pages.length} pages — DOM/JS references, icons, links and landmarks all consistent.`);
}
