import type { AnchorHTMLAttributes, CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "display";

export function Heading({
  as: As = "h2",
  size = "3xl",
  display,
  className,
  style,
  ...rest
}: { as?: ElementType; size?: Size; display?: boolean } & HTMLAttributes<HTMLHeadingElement>) {
  return (
    <As
      className={cx("ph-heading", display && "ph-heading--display", className)}
      style={{ fontSize: `var(--ph-text-${size})`, ...(style as CSSProperties) }}
      {...rest}
    />
  );
}

export function Text({
  as: As = "p",
  size = "base",
  tone = "default",
  className,
  style,
  ...rest
}: { as?: ElementType; size?: Size; tone?: "default" | "muted" | "accent" } & HTMLAttributes<HTMLElement>) {
  return (
    <As
      className={cx("ph-text", tone !== "default" && `ph-text--${tone}`, className)}
      style={{ fontSize: `var(--ph-text-${size})`, ...(style as CSSProperties) }}
      {...rest}
    />
  );
}

/** Small uppercase label above headings. */
export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("ph-eyebrow", className)} {...rest} />;
}

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "underline" | "plain" | "accent";
  external?: boolean;
  as?: ElementType;
  [k: string]: unknown;
};
/** Underline link. Pass `as={NextLink}` to use a framework router link. External links get rel="noopener noreferrer". */
export function Link({ as: As = "a", variant = "underline", external, className, rel, target, ...rest }: LinkProps) {
  const ext = external ?? (typeof rest.href === "string" && /^https?:\/\//.test(rest.href));
  return (
    <As
      className={cx("ph-link", `ph-link--${variant}`, className)}
      {...(ext ? { target: target ?? "_blank", rel: rel ?? "noopener noreferrer" } : { target, rel })}
      {...rest}
    />
  );
}

export function Separator({ vertical, className, ...rest }: { vertical?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      className={cx("ph-separator", vertical && "ph-separator--v", className)}
      {...rest}
    />
  );
}

export function VisuallyHidden({ as: As = "span", ...rest }: { as?: ElementType; children?: ReactNode }) {
  return <As className="ph-sr-only" {...rest} />;
}

/** Typographic wrapper for long-form content (MDX / markdown output). */
export function Prose({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ph-prose", className)} {...rest} />;
}
