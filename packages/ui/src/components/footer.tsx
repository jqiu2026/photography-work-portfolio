import type { ReactNode } from "react";
import { cx } from "./cx";
import type { SiteEntry } from "./navigation";
import { SocialLinks, type SocialLink } from "./profile";

/** "More from me": the family row shown in every footer. */
export function MoreFromMe({ sites, currentId, title = "More from me" }: { sites: SiteEntry[]; currentId: string; title?: string }) {
  return (
    <nav aria-label={title} className="ph-more">
      <h2 className="ph-eyebrow">{title}</h2>
      <ul>
        {sites.filter((s) => s.id !== currentId).map((s) => (
          <li key={s.id}>
            <a href={s.url}><strong>{s.name}</strong><span>{s.description}</span></a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer({ sites, currentId, social, legal, note, className }: { sites: SiteEntry[]; currentId: string; social?: SocialLink[]; legal: { label: string; href: string }[]; note?: ReactNode; className?: string }) {
  return (
    <footer className={cx("ph-footer", className)}>
      <div className="ph-footer__inner">
        <MoreFromMe sites={sites} currentId={currentId} />
        {social?.length ? <SocialLinks links={social} variant="icons" /> : null}
        <div className="ph-footer__legal">
          <p>{note}</p>
          <nav aria-label="Legal">
            <ul>{legal.map((l) => <li key={l.label}><a href={l.href}>{l.label}</a></li>)}</ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="ph-crumbs">
      <ol>
        {items.map((i, n) => (
          <li key={i.label}>{i.href && n < items.length - 1 ? <a href={i.href}>{i.label}</a> : <span aria-current="page">{i.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="ph-pagination">
      {page > 1 ? <a href={hrefFor(page - 1)} rel="prev">← Previous</a> : <span />}
      <span aria-current="page">Page {page} of {pages}</span>
      {page < pages ? <a href={hrefFor(page + 1)} rel="next">Next →</a> : <span />}
    </nav>
  );
}
