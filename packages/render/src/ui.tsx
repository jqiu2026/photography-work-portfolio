import { clsx as cx } from "clsx";
import type { AnchorHTMLAttributes, ElementType, HTMLAttributes, ReactNode } from "react";

/** Long-form text: headings, lists, quotes, code and images at a readable measure. */
export function Prose({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rd-prose", className)} {...rest} />;
}

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "underline" | "plain" | "accent";
  external?: boolean;
  as?: ElementType;
  [k: string]: unknown;
};
/** Underlined link. Pass `as={NextLink}` for a router link. External links get rel="noopener noreferrer". */
export function Link({ as: As = "a", variant = "underline", external, className, rel, target, ...rest }: LinkProps) {
  const ext = external ?? (typeof rest.href === "string" && /^https?:\/\//.test(rest.href));
  return (
    <As
      className={cx("rd-link", `rd-link--${variant}`, className)}
      {...(ext ? { target: target ?? "_blank", rel: rel ?? "noopener noreferrer" } : { target, rel })}
      {...rest}
    />
  );
}

export function Quote({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <figure className="rd-quote">
      <blockquote>{children}</blockquote>
      {cite ? <figcaption>{cite}</figcaption> : null}
    </figure>
  );
}

export { EmbedFacade, type EmbedProvider } from "./embed";
