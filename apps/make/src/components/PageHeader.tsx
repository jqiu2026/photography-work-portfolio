import { PageDescription, PageEyebrow, PageHeader as HmPageHeader, PageTitle } from "@holominimal/ui";
import type { ReactNode } from "react";

/** Standard top of an inner page: eyebrow, title, optional intro. Holominimal's page header on the site's own width. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: { eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mk-wrap mk-pagehead">
      <HmPageHeader className="hm-enter">
        {eyebrow ? <PageEyebrow>{eyebrow}</PageEyebrow> : null}
        <PageTitle>{title}</PageTitle>
        {intro ? <PageDescription>{intro}</PageDescription> : null}
      </HmPageHeader>
      {children}
    </div>
  );
}
