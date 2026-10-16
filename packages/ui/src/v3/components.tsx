import type { CSSProperties, ElementType, ReactNode } from "react";
import { cx } from "../components/cx";
import { Image, type ImageAsset } from "../media/Image";

/*
 * v3 building blocks (docs/project/18-design-prompt-v3.md section 0). Everything here renders a finished page without
 * JavaScript; `Runtime` (client) only adds motion on top.
 */

/** Colossal display type. The real text lives in the heading (hidden), the cropped words are aria-hidden. */
export function Colossal({
  as: As = "h1",
  label,
  lines,
  size = "xl",
  className,
  split = false,
}: {
  /** Split into letters that rise one by one (the hub's product-reveal entrance). */
  split?: boolean;
  as?: "h1" | "h2" | "p" | "div";
  /** The accessible name. Omit for purely decorative type (footer, marquee): then nothing is exposed. */
  label?: string;
  lines: string[];
  size?: "xl" | "lg" | "md" | "hero";
  className?: string;
}) {
  const Tag = As as ElementType;
  return (
    <Tag className={cx("hl3-colossal", `hl3-colossal--${size}`, className)} {...(label ? {} : { "aria-hidden": true })}>
      {label ? <span className="hl-sr-only">{label}</span> : null}
      <span aria-hidden={label ? true : undefined} className="hl3-colossal__lines">
        {lines.map((l, i) => (
          <span key={`${l}-${i}`} className="hl3-colossal__line" data-reveal style={{ "--i": i } as CSSProperties}>
            {split ? (
              <span>
                {Array.from(l).map((ch, k) => (
                  <span key={k} className="hl3-ch" style={{ "--c": k + i * 5 } as CSSProperties}>
                    {ch}
                  </span>
                ))}
              </span>
            ) : (
              <span>{l}</span>
            )}
          </span>
        ))}
      </span>
    </Tag>
  );
}

/** A heading split into lines that rise out of a mask. Lines are given, not measured, so the server render is final. */
export function Lines({ as: As = "h2", lines, className }: { as?: ElementType; lines: string[]; className?: string }) {
  return (
    <As className={cx("hl3-lines", className)} data-reveal>
      {lines.map((l, i) => (
        <span key={`${l}-${i}`} className="hl3-line" style={{ "--i": i } as CSSProperties}>
          <span>
            {l}
            {i < lines.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </As>
  );
}

/** A photograph that enters soft and resolves sharp (opacity + transform only, no animated filter). */
export function FocusPull({
  asset,
  alt,
  sizes,
  priority,
  fill,
  className,
}: { asset: ImageAsset; alt: string; sizes?: string; priority?: boolean; fill?: boolean; className?: string }) {
  return (
    <span className={cx("hl3-pull", fill && "hl3-pull--fill", className)} data-pull={priority ? undefined : ""}>
      <Image asset={asset} alt={alt} sizes={sizes} priority={priority} fill={fill} />
      {asset.blur ? (
        <span aria-hidden className="hl3-pull__soft" style={{ backgroundImage: `url(${asset.blur})` }} />
      ) : null}
    </span>
  );
}

/** Ambient wash: pre-blurred derivatives of the current photograph, scaled up, behind a section. Static image layers. */
export function AmbientWash({
  images,
  active = 0,
  strength = 0.36,
  className,
}: { images: (string | undefined)[]; active?: number; strength?: number; className?: string }) {
  return (
    <div className={cx("hl3-wash", className)} aria-hidden data-wash style={{ "--wash": strength } as CSSProperties}>
      {images.map((src, i) =>
        src ? (
          <span
            key={`${i}-${src.slice(-12)}`}
            className={cx("hl3-wash__layer", i === active && "is-active")}
            style={{ backgroundImage: `url(${src})` }}
          />
        ) : null,
      )}
    </div>
  );
}

/** One slow line of colossal type drifting sideways. Static and wrapped when motion is off. */
export function Marquee({ words, className, label }: { words: string[]; className?: string; label?: string }) {
  const run = (hidden: boolean) => (
    <span className="hl3-marquee__run" aria-hidden={hidden || undefined}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>{w}</span>
      ))}
    </span>
  );
  return (
    <div
      className={cx("hl3-marquee", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className="hl3-marquee__track">
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}

/** Sticky stack: each panel pins for 100vh and is covered by the next. Works with no JavaScript (native sticky). */
export function StickyStack({
  children,
  className,
  label,
}: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div className={cx("hl3-stack", className)} role={label ? "group" : undefined} aria-label={label}>
      {children}
    </div>
  );
}
export function StackPanel({
  children,
  className,
  as: As = "section",
}: { children: ReactNode; className?: string; as?: ElementType }) {
  return <As className={cx("hl3-stack__panel", className)}>{children}</As>;
}

export function Wrap({
  children,
  className,
  as: As = "div",
}: { children: ReactNode; className?: string; as?: ElementType }) {
  return <As className={cx("hl3-wrap", className)}>{children}</As>;
}

export function ArrowLink({
  href,
  children,
  variant = "link",
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "link";
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  return (
    <a
      href={href}
      className={cx(variant === "link" ? "hl3-link" : "hl3-btn", variant === "ghost" && "hl3-btn--ghost", className)}
      {...rest}
    >
      <span>{children}</span>
      <i aria-hidden className="hl3-arrow">
        →
      </i>
    </a>
  );
}

export function ScrollCue() {
  return <span aria-hidden className="hl3-cue" />;
}
