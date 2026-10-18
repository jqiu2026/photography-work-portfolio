import type { HTMLAttributes } from "react";
/**
 * The studio page header: an eyebrow (where you are), an editorial title, one sentence on what the page is for, and the
 * page's siblings as quiet tabs. Server-compatible.
 *
 *   <PageHeader><PageEyebrow>Galleries</PageEyebrow><PageTitle>All galleries</PageTitle>
 *     <PageDescription>Client galleries and how they are delivered.</PageDescription>
 *     <PageTabs aria-label="Galleries pages"><PageTab href="/g" current>All</PageTab>...</PageTabs></PageHeader>
 */
export declare function PageHeader({ className, ...rest }: HTMLAttributes<HTMLElement>): import("react").JSX.Element;
export declare function PageEyebrow({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
export declare function PageTitle({ as: Heading, className, ...rest }: HTMLAttributes<HTMLHeadingElement> & {
    /** The heading level. Default `h1`; use a lower level when the header sits inside a section. */
    as?: "h1" | "h2" | "h3";
}): import("react").JSX.Element;
export declare function PageDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
/** Actions aligned with the title (a primary button, a menu). */
export declare function PageActions({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
