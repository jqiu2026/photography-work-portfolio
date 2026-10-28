import { EmbedFacade, Link, Prose } from "./ui";
import { ProtectedImage } from "./media";
import NextLink from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components, defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

/**
 * CMS content is Markdown only: no raw HTML, no JSX, no scripts (react-markdown never uses dangerouslySetInnerHTML, and
 * raw HTML is not parsed). The one extension is a click-to-load video shortcode on its own line:
 *     [[youtube ID]]   or   [[youtube ID ID ID ID]]   (a grid)
 * Nothing from YouTube loads until a visitor presses play.
 */
const SHORTCODE = /^\[\[youtube\s+([\w-]{6,20}(?:\s+[\w-]{6,20}){0,5})\]\]$/;

function remarkShortcodes() {
  return (tree: unknown) => {
    visit(
      tree as never,
      "paragraph",
      (node: { children: { type: string; value?: string }[]; data?: unknown; type: string }) => {
        if (node.children.length !== 1 || node.children[0].type !== "text") return;
        const m = SHORTCODE.exec((node.children[0].value ?? "").trim());
        if (!m) return;
        node.type = "paragraph";
        node.data = { hName: "div", hProperties: { "data-embed": "youtube", "data-ids": m[1].split(/\s+/).join(",") } };
        node.children = [];
      },
    );
  };
}

const MEDIA_SRC = /^media:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** `media:UUID` points at a library image; it is served by the protected image route (never a raw file URL). */
export function transformUrl(url: string): string {
  const m = MEDIA_SRC.exec(url.trim());
  if (m) return `/api/img/${m[1].toLowerCase()}?w=1600`;
  return defaultUrlTransform(url);
}

function safeHref(href: string | undefined) {
  if (!href) return undefined;
  if (/^(https?:|mailto:|\/|#)/i.test(href)) return href;
  return undefined; // javascript:, data:, etc. are dropped
}

const SERVED_MEDIA = /^\/api\/img\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\?w=1600$/;

/**
 * `protectMedia`: library images (`media:UUID`) render as protected, token-fetched photographs (the photo site), and
 * any other markdown image is dropped, so no photograph can reach the page as a plain file URL. Without it (the hub)
 * they are plain responsive images from the image route.
 */
function makeComponents(protectMedia: boolean): Components {
  return {
    ...components,
    img({ src, alt }) {
      if (protectMedia) {
        const m = typeof src === "string" ? SERVED_MEDIA.exec(src) : null;
        // Intrinsic size is unknown in Markdown: a 3:2 frame with the picture contained inside it.
        return m ? (
          <ProtectedImage asset={{ id: m[1], width: 1600, height: 1067 }} alt={alt ?? ""} fit="contain" />
        ) : null;
      }
      const s = typeof src === "string" && /^(https:\/\/|\/)/.test(src) ? src : undefined;
      // eslint-disable-next-line @next/next/no-img-element
      return s ? <img src={s} alt={alt ?? ""} loading="lazy" /> : null;
    },
  };
}

const components: Components = {
  a({ href, children }) {
    const h = safeHref(href);
    if (!h) return <>{children}</>;
    if (h.startsWith("/"))
      return (
        <Link as={NextLink} href={h}>
          {children}
        </Link>
      );
    return <Link href={h}>{children}</Link>;
  },
  div(props) {
    const p = props as { "data-embed"?: string; "data-ids"?: string; children?: ReactNode };
    if (p["data-embed"] === "youtube" && p["data-ids"]) {
      const ids = p["data-ids"].split(",");
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: ids.length > 1 ? "repeat(auto-fit, minmax(16rem, 1fr))" : "1fr",
            gap: "1.5rem",
            margin: "1.5rem 0",
          }}
        >
          {ids.map((id, i) => (
            <EmbedFacade key={id} provider="youtube" id={id} title={`Video ${i + 1}`} />
          ))}
        </div>
      );
    }
    return <div>{p.children}</div>;
  },
};

/** Markdown without the Prose wrapper, for places that already provide one. */
export function RenderMarkdownBare({ source, protectMedia = false }: { source: string; protectMedia?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkShortcodes]}
      components={makeComponents(protectMedia)}
      urlTransform={transformUrl}
      skipHtml
    >
      {source}
    </ReactMarkdown>
  );
}

export function RenderMarkdown({ source, protectMedia = false }: { source: string; protectMedia?: boolean }) {
  return (
    <Prose>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkShortcodes]}
        components={makeComponents(protectMedia)}
        urlTransform={transformUrl}
        skipHtml
      >
        {source}
      </ReactMarkdown>
    </Prose>
  );
}
