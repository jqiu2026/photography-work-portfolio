import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx";
import { SocialLinks, type SocialLink } from "./profile";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="hl-crumbs">
      <ol>
        {items.map((i, n) => (
          <li key={i.label}>
            {i.href && n < items.length - 1 ? (
              <a href={i.href}>{i.label}</a>
            ) : (
              <span aria-current="page">{i.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="hl-pagination">
      {page > 1 ? (
        <a href={hrefFor(page - 1)} rel="prev">
          ← Previous
        </a>
      ) : (
        <span />
      )}
      <span aria-current="page">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <a href={hrefFor(page + 1)} rel="next">
          Next →
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
