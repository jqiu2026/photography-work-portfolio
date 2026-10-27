import { PageDescription, PageEyebrow, PageHeader as HmPageHeader, PageTitle } from "@holominimal/ui";
import type { ReactNode } from "react";

/** Standard top of an inner page: eyebrow, title, optional intro. */
export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: ReactNode }) {
  return (
    <div className="hb-wrap hb-pagehead">
      <HmPageHeader className="hm-enter">
        {eyebrow ? <PageEyebrow>{eyebrow}</PageEyebrow> : null}
        <PageTitle>{title}</PageTitle>
        {intro ? <PageDescription>{intro}</PageDescription> : null}
      </HmPageHeader>
    </div>
  );
}
