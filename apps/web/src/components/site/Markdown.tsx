import NextLink from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components, defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { YouTubeFacade } from "./YouTubeFacade";

/**
 * CMS content is Markdown only: no raw HTML, no JSX, no scripts (react-markdown never uses dangerouslySetInnerHTML, and
 * raw HTML is not parsed). The one extension is a click-to-load video shortcode on its own line:
 *     [[youtube ID]]   or   [[youtube ID ID ID ID]]   (a grid)
 * `media:UUID` points at a library image and is served by the image route.
 */
const SHORTCODE = /^\[\[youtube\s+([\w-]{6,20}(?:\s+[\w-]{6,20}){0,5})\]\]$/;
const MEDIA_SRC = /^media:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function remarkShortcodes() {
  return (tree: unknown) => {
    visit(
      tree as never,
      "paragraph",
      (node: { children: { type: string; value?: string }[]; data?: unknown; type: string }) => {
        if (node.children.length !== 1 || node.children[0].type !== "text") return;
        const m = SHORTCODE.exec((node.children[0].value ?? "").trim());
        if (!m) return;
        node.data = { hName: "div", hProperties: { "data-embed": "youtube", "data-ids": m[1].split(/\s+/).join(",") } };
        node.children = [];
      },
    );
  };
}

export function transformUrl(url: string): string {
  const m = MEDIA_SRC.exec(url.trim());
  return m ? `/api/img/${m[1].toLowerCase()}?w=1600` : defaultUrlTransform(url);
}

const safeHref = (href?: string) => (href && /^(https?:|mailto:|\/|#)/i.test(href) ? href : undefined);

const components: Components = {
  a({ href, children }) {
    const h = safeHref(href);
    if (!h) return <>{children}</>;
    if (h.startsWith("/")) return <NextLink href={h}>{children}</NextLink>;
    return (
      <a href={h} rel={h.startsWith("http") ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    );
  },
  img({ src, alt }) {
    const s = typeof src === "string" && /^(https:\/\/|\/)/.test(src) ? src : undefined;
    // eslint-disable-next-line @next/next/no-img-element
    return s ? <img src={s} alt={alt ?? ""} loading="lazy" /> : null;
  },
  div(props) {
    const p = props as { "data-embed"?: string; "data-ids"?: string; children?: ReactNode };
    if (p["data-embed"] === "youtube" && p["data-ids"]) {
      const ids = p["data-ids"].split(",");
      return (
        <div className="hb-embeds">
          {ids.map((id, i) => (
            <YouTubeFacade key={id} id={id} title={`Video ${i + 1}`} />
          ))}
        </div>
      );
    }
    return <div>{p.children}</div>;
  },
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="hm-prose hb-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkShortcodes]}
        components={components}
        urlTransform={transformUrl}
        skipHtml
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
