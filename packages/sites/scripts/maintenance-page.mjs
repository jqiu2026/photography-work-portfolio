import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Heading, Text, Theme } from "@holominimal/ui";

/**
 * The "back soon" page for jerryqiu.com, as one self-contained HTML document (Holominimal components and tokens, the
 * rules it uses inlined, no script, no external request). `build-maintenance.mjs` writes it to `src/maintenance-html.ts`
 * so that every app can answer with it from its proxy without touching a database, a layout or a font file.
 *
 * Every line of copy here is a draft. TODO(owner): rewrite it in your voice, and add the date.
 */
export const COPY = {
  // TODO(owner): the title shown in the browser tab
  title: "Back soon · Jerry Qiu",
  // TODO(owner): the small line above the headline
  mark: "Jerry Qiu",
  // TODO(owner): the headline: the plain word, then the emphasized one
  headline: ["Back", "soon."],
  // TODO(owner): two or three sentences: what is happening, and roughly when (add the date here when you know it)
  lede: [
    "I am rebuilding this site from the ground up.",
    "The new one is on the way, and I will have it up as soon as it is ready.",
  ],
  // TODO(owner): the one way to reach you 
  email: "info@jerryqiu.com",
  emailLabel: "Inquiries",
  // TODO(owner): the copyright line; %YEAR% is filled in when the page is served
  copyright: "© %YEAR% Jerry Qiu.",
};

/** The rules of the page itself: layout only; color, type and shape come from the Holominimal tokens. */
const PAGE_CSS = `
html{color-scheme:dark;background:var(--hm-bg,#000);height:100%;overflow:hidden}
body{margin:0;height:100vh;height:100svh;overflow:hidden}
.soon{position:relative;display:grid;place-items:center;height:100vh;height:100svh;box-sizing:border-box;padding:1.5rem var(--hm-gutter,1.25rem);overflow:hidden;
background:radial-gradient(60rem 36rem at 12% 8%,hsl(var(--hm-violet) / .26),transparent 70%),radial-gradient(48rem 30rem at 92% 96%,hsl(var(--hm-cyan) / .14),transparent 70%),var(--hm-bg,#000)}
.soon-inner{display:grid;justify-items:start;gap:1.1rem;width:min(100%,54rem)}
.soon .soon-title{margin:0;font-size:clamp(2.6rem,9vw,6rem);font-weight:400;line-height:.98;letter-spacing:-.04em}
.soon-lede{display:grid;gap:.5rem;max-width:30rem;margin:0}
.soon-lede p{margin:0}
.soon .soon-title .hm-iridescent-text{display:inline-block;padding-right:.08em;background-image:linear-gradient(90deg,#fff 0%,hsl(var(--hm-violet)) 45%,hsl(var(--hm-cyan)) 100%);background-size:100% 100%}
.soon-foot{margin-top:1.2rem}
`;

/** Keeps the rules of `css` that matter for `html`: those naming a class it uses, plus the page-wide ones. */
export function trimCss(css, html) {
  const used = new Set();
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) used.add(c);
  const pageWide = /^(:root|html|body|\*|::selection|\[data-hm-(scheme|motion|surface)[^\]]*\](\s|$|,)|\.hm-theme)/;
  const blocks = (src) => {
    const out = [];
    let depth = 0;
    let start = 0;
    let inComment = false;
    for (let i = 0; i < src.length; i++) {
      const two = src.slice(i, i + 2);
      if (!inComment && two === "/*") inComment = true;
      else if (inComment && two === "*/") {
        inComment = false;
        i++;
        if (depth === 0) start = i + 1;
      } else if (!inComment) {
        const ch = src[i];
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            out.push(src.slice(start, i + 1).trim());
            start = i + 1;
          }
        } else if (ch === ";" && depth === 0) {
          out.push(src.slice(start, i + 1).trim());
          start = i + 1;
        }
      }
    }
    return out;
  };
  const wanted = (selector) =>
    selector.split(",").some((part) => {
      const s = part.trim();
      if (pageWide.test(s)) return true;
      for (const m of s.matchAll(/\.([\w-]+)/g)) if (used.has(m[1])) return true;
      return false;
    });
  const keepers = [];
  const keyframes = new Map();
  const filter = (src) => {
    const kept = [];
    for (const b of blocks(src)) {
      if (!b) continue;
      const open = b.indexOf("{");
      if (open < 0) continue;
      const prelude = b.slice(0, open).trim();
      const body = b.slice(open + 1, b.lastIndexOf("}"));
      if (prelude.startsWith("@keyframes")) {
        keyframes.set(prelude.split(/\s+/)[1], b);
      } else if (prelude.startsWith("@media") || prelude.startsWith("@supports")) {
        const inner = filter(body);
        if (inner.length) kept.push(`${prelude}{${inner.join("")}}`);
      } else if (prelude.startsWith("@property") || prelude.startsWith("@font-face")) {
        // custom property registrations the kept rules may rely on
        if (prelude.startsWith("@property")) kept.push(b);
      } else if (!prelude.startsWith("@") && wanted(prelude)) kept.push(b);
    }
    return kept;
  };
  keepers.push(...filter(css));
  const text = keepers.join("\n");
  const frames = [...keyframes.entries()].filter(([name]) => text.includes(name)).map(([, b]) => b);
  return `${text}\n${frames.join("\n")}`;
}

/** The whole document as a string; `%YEAR%` is replaced when it is served. */
export function renderMaintenancePage() {
  const require = createRequire(import.meta.url);
  const read = (spec) => readFileSync(require.resolve(spec), "utf8");
  const body = renderToStaticMarkup(
    h(
      Theme,
      { as: "main", theme: { scheme: "dark", accent: "violet" }, className: "soon" },
      h(
        "div",
        { className: "soon-inner" },
        h(Text, { eyebrow: true, tone: "muted" }, COPY.mark),
        h(
          Heading,
          { level: 1, className: "soon-title" },
          `${COPY.headline[0]} `,
          h("span", { className: "hm-iridescent-text" }, COPY.headline[1]),
        ),
        h("div", { className: "soon-lede" }, ...COPY.lede.map((t) => h(Text, { key: t, size: "lg", tone: "soft" }, t))),
        h(
          "div",
          { className: "soon-foot" },
          h(
            Button,
            { asChild: true, size: "md" },
            h("a", { href: `mailto:${COPY.email}` }, `${COPY.emailLabel}: ${COPY.email}`),
          ),
        ),
        h(Text, { size: "sm", tone: "dim" }, COPY.copyright),
      ),
    ),
  );
  const css = `${read("@holominimal/ui/tokens.css")}\n${trimCss(read("@holominimal/ui/styles.css"), body)}\n${PAGE_CSS}`;
  const min = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1");
  return `<!doctype html><html lang="en" data-hm-scheme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${COPY.title}</title><meta name="robots" content="noindex, nofollow"><meta name="color-scheme" content="dark"><style>${min}</style></head><body>${body}</body></html>`;
}
