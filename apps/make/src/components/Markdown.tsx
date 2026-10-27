import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Write-ups are Markdown only: no raw HTML (react-markdown never parses it), links only over https (or on this site), and
 * no images in the text: screenshots are added in the studio, where they are checked first.
 */
const safeHref = (href?: string) =>
  href && (href.startsWith("https://") || href.startsWith("/") || href.startsWith("#")) ? href : undefined;

export function Markdown({ children }: { children: string }) {
  return (
    <div className="hm-prose mk-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children: c }: ComponentProps<"a">) => {
            const h = safeHref(href);
            return h ? (
              <a href={h} rel={h.startsWith("https://") ? "noopener noreferrer" : undefined}>
                {c}
              </a>
            ) : (
              <>{c}</>
            );
          },
          img: () => null,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
