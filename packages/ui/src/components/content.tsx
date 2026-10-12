import type { HTMLAttributes, ReactNode, ElementType } from "react";
import { cx } from "./cx";

export function Card({ as: As = "div", interactive, className, ...rest }: { as?: ElementType; interactive?: boolean } & HTMLAttributes<HTMLElement> & { href?: string }) {
  return <As className={cx("ph-card", interactive && "ph-card--interactive", className)} {...rest} />;
}

export function Avatar({ src, alt, name, size = 48 }: { src?: string; alt?: string; name: string; size?: number }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return src ? (
    // biome-ignore lint/performance/noImgElement: framework-agnostic package
    <img className="ph-avatar" src={src} alt={alt ?? name} width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span className="ph-avatar ph-avatar--fallback" role="img" aria-label={alt ?? name} style={{ width: size, height: size }}>{initials}</span>
  );
}

export function Stat({ value, label, className }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={cx("ph-stat", className)}>
      <div className="ph-stat__value">{value}</div>
      <div className="ph-stat__label">{label}</div>
    </div>
  );
}

export function Quote({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <figure className="ph-quote">
      <blockquote>{children}</blockquote>
      {cite ? <figcaption>{cite}</figcaption> : null}
    </figure>
  );
}

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <pre className="ph-code" data-language={language}>
      <code>{code}</code>
    </pre>
  );
}

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="ph-table-wrap" role="region" tabIndex={0} aria-label="Scrollable table">
      <table className={cx("ph-table", className)} {...rest} />
    </div>
  );
}
