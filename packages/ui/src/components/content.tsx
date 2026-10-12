import type { HTMLAttributes, ReactNode, ElementType } from "react";
import { cx } from "./cx";

export function Card({
  as: As = "div",
  interactive,
  className,
  ...rest
}: { as?: ElementType; interactive?: boolean } & HTMLAttributes<HTMLElement> & { href?: string }) {
  return <As className={cx("hl-card", interactive && "hl-card--interactive", className)} {...rest} />;
}

export function Avatar({ src, alt, name, size = 48 }: { src?: string; alt?: string; name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return src ? (
    <img
      className="hl-avatar"
      src={src}
      alt={alt ?? name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="hl-avatar hl-avatar--fallback"
      role="img"
      aria-label={alt ?? name}
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export function Stat({ value, label, className }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={cx("hl-stat", className)}>
      <div className="hl-stat__value">{value}</div>
      <div className="hl-stat__label">{label}</div>
    </div>
  );
}

export function Quote({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <figure className="hl-quote">
      <blockquote>{children}</blockquote>
      {cite ? <figcaption>{cite}</figcaption> : null}
    </figure>
  );
}

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <pre className="hl-code" data-language={language} tabIndex={0} aria-label={language ? `${language} code` : "Code"}>
      <code>{code}</code>
    </pre>
  );
}

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="hl-table-wrap" role="region" tabIndex={0} aria-label="Scrollable table">
      <table className={cx("hl-table", className)} {...rest} />
    </div>
  );
}
