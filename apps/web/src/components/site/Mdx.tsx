import { MDXRemote } from "next-mdx-remote/rsc";
import NextLink from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { slugify } from "transliteration";
import { EmbedGrid } from "./YouTubeFacade";

const text = (n: ReactNode): string => (typeof n === "string" ? n : Array.isArray(n) ? n.map(text).join("") : "");

function heading(level: 2 | 3) {
  const Tag = `h${level}` as const;
  return function H({ children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
    return (
      <Tag id={slugify(text(children))} {...rest}>
        {children}
      </Tag>
    );
  };
}

function A({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/"))
    return (
      <NextLink href={href} {...rest}>
        {children}
      </NextLink>
    );
  return (
    <a href={href} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} {...rest}>
      {children}
    </a>
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

/** Posts that live in the repository as MDX. They are authored by the owner (trusted), so JSX expressions are allowed. Images are left out, as before. */
export function Mdx({ source }: { source: string }) {
  return (
    <div className="hm-prose hb-prose">
      <MDXRemote
        source={stripTba(source)}
        options={{ blockJS: false }}
        components={{ h2: heading(2), h3: heading(3), a: A, EmbedGrid, SmartLink: A, img: () => null }}
      />
    </div>
  );
}
