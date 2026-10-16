import { EmbedFacade, Link, Prose } from "@halation/ui";
import { MDXRemote } from "next-mdx-remote/rsc";
import NextLink from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { slugify } from "transliteration";

const text = (n: ReactNode): string => (typeof n === "string" ? n : Array.isArray(n) ? n.map(text).join("") : "");

function heading(level: 2 | 3) {
  const Tag = `h${level}` as const;
  return function H({ children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
    const id = slugify(text(children));
    return (
      <Tag id={id} {...rest}>
        {children}
      </Tag>
    );
  };
}

function A({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/"))
    return (
      <Link as={NextLink} href={href} {...rest}>
        {children}
      </Link>
    );
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

/** Four YouTube videos in a responsive grid; nothing loads until a visitor presses play. */
function EmbedGrid({ videos }: { videos: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
        gap: "1.5rem",
        margin: "1.5rem 0",
      }}
    >
      {videos.map((id, i) => (
        <EmbedFacade key={id} provider="youtube" id={id} title={`Video ${i + 1}`} />
      ))}
    </div>
  );
}

/** Drop sections whose entire body is a "TBA" placeholder (kept visible in dev, hidden in production). */
export function stripTba(source: string) {
  if (process.env.NODE_ENV !== "production") return source;
  return source
    .split(/\n(?=#{1,3} )/)
    .filter((block) => !/^#{1,3} .*\n+\s*TBA\s*$/i.test(block.trim()))
    .join("\n");
}

export function MDX({ source }: { source: string }) {
  return (
    <Prose>
      {/* Content is authored in the repo (trusted), so JSX expressions are allowed. Revisit for CMS content in Phase 2. */}
      <MDXRemote
        source={stripTba(source)}
        options={{ blockJS: false }}
        components={{ h2: heading(2), h3: heading(3), a: A, EmbedGrid, SmartLink: A, img: () => null }}
      />
    </Prose>
  );
}
